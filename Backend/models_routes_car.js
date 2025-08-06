const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Car = require('../models_routes_car');
const Booking = require('../models_routes_booking');
const { validateCar } = require('../middleware_validation');


// Get all cars with filtering
router.get('/', async (req, res) => {
    try {
        const {
            category,
            minPrice,
            maxPrice,
            status,
            startDate,
            endDate,
            seats,
            transmission,
            fuelType,
            page = 1,
            limit = 12
        } = req.query;

        const query = {};

        // Build filter query
        if (category) query.category = category;
        if (status) query.status = status;
        if (minPrice || maxPrice) {
            query.dailyRate = {};
            if (minPrice) query.dailyRate.$gte = parseFloat(minPrice);
            if (maxPrice) query.dailyRate.$lte = parseFloat(maxPrice);
        }
        if (seats) query.seats = parseInt(seats);
        if (transmission) query.transmission = transmission;
        if (fuelType) query.fuelType = fuelType;

        let cars = await Car.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        // Filter cars by availability if dates provided
        if (startDate && endDate) {
            const availableCars = [];

            for (let car of cars) {
                const conflictingBookings = await Booking.find({
                    car: car._id,
                    status: { $in: ['Confirmed', 'Active'] },
                    $or: [
                        {
                            'rental.startDate': { $lte: new Date(endDate) },
                            'rental.endDate': { $gte: new Date(startDate) }
                        }
                    ]
                });

                if (conflictingBookings.length === 0) {
                    availableCars.push(car);
                }
            }
            cars = availableCars;
        }

        const total = await Car.countDocuments(query);

        res.json({
            success: true,
            data: cars,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching cars',
            error: error.message
        });
    }
});

// Get car by ID
router.get('/:id', async (req, res) => {
    try {
        const car = await Car.findById(req.params.id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        res.json({
            success: true,
            data: car
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching car',
            error: error.message
        });
    }
});

// Create new car
router.post('/', validateCar, async (req, res) => {
    try {
        const car = new Car(req.body);
        await car.save();

        res.status(201).json({
            success: true,
            message: 'Car created successfully',
            data: car
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'License plate already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating car',
            error: error.message
        });
    }
});

// Update car
router.put('/:id', validateCar, async (req, res) => {
    try {
        const car = await Car.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        res.json({
            success: true,
            message: 'Car updated successfully',
            data: car
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating car',
            error: error.message
        });
    }
});

// Delete car
router.delete('/:id', async (req, res) => {
    try {
        // Check if car has active bookings
        const activeBookings = await Booking.find({
            car: req.params.id,
            status: { $in: ['Confirmed', 'Active'] }
        });

        if (activeBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete car with active bookings'
            });
        }

        const car = await Car.findByIdAndDelete(req.params.id);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        res.json({
            success: true,
            message: 'Car deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting car',
            error: error.message
        });
    }
});

// Get available cars for specific dates
router.get('/available/:startDate/:endDate', async (req, res) => {
    try {
        const { startDate, endDate } = req.params;
        const { category, minPrice, maxPrice } = req.query;

        const query = { status: 'Available' };
        if (category) query.category = category;
        if (minPrice || maxPrice) {
            query.dailyRate = {};
            if (minPrice) query.dailyRate.$gte = parseFloat(minPrice);
            if (maxPrice) query.dailyRate.$lte = parseFloat(maxPrice);
        }

        const allCars = await Car.find(query);
        const availableCars = [];

        for (let car of allCars) {
            const conflictingBookings = await Booking.find({
                car: car._id,
                status: { $in: ['Confirmed', 'Active'] },
                $or: [
                    {
                        'rental.startDate': { $lte: new Date(endDate) },
                        'rental.endDate': { $gte: new Date(startDate) }
                    }
                ]
            });

            if (conflictingBookings.length === 0) {
                availableCars.push(car);
            }
        }

        res.json({
            success: true,
            data: availableCars
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching available cars',
            error: error.message
        });
    }
});

// Get car categories and stats
router.get('/stats/categories', async (req, res) => {
    try {
        const stats = await Car.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    avgPrice: { $avg: '$dailyRate' },
                    minPrice: { $min: '$dailyRate' },
                    maxPrice: { $max: '$dailyRate' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching car stats',
            error: error.message
        });
    }
});

module.exports = router;


// Car Models

const carSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true
    },
    model: {
        type: String,
        required: [true, 'Model is required'],
        trim: true
    },
    year: {
        type: Number,
        required: [true, 'Year is required'],
        min: 2000,
        max: new Date().getFullYear() + 1
    },
    licensePlate: {
        type: String,
        required: [true, 'License plate is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Economy', 'Compact', 'SUV', 'Luxury', 'Sports'],
        default: 'Economy'
    },
    dailyRate: {
        type: Number,
        required: [true, 'Daily rate is required'],
        min: 0
    },
    features: [{
        type: String
    }],
    fuelType: {
        type: String,
        enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
        default: 'Petrol'
    },
    transmission: {
        type: String,
        enum: ['Manual', 'Automatic'],
        default: 'Manual'
    },
    seats: {
        type: Number,
        min: 2,
        max: 8,
        default: 5
    },
    imageUrl: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['Available', 'Rented', 'Maintenance'],
        default: 'Available'
    },
    location: {
        type: String,
        default: 'Main Branch'
    },
    mileage: {
        type: Number,
        min: 0,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient queries
carSchema.index({ status: 1, category: 1 });
carSchema.index({ licensePlate: 1 });

module.exports = mongoose.model('Car', carSchema);
