const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Booking = require('../models_routes_booking');
const Car = require('../models_routes_car');
const { validateBooking } = require('../middleware_validation');
const moment = require('moment');

// Get all bookings with filtering
router.get('/', async (req, res) => {
    try {
        const {
            status,
            email,
            startDate,
            endDate,
            carId,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};

        if (status) query.status = status;
        if (email) query['customer.email'] = new RegExp(email, 'i');
        if (carId) query.car = carId;
        if (startDate && endDate) {
            query['rental.startDate'] = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const bookings = await Booking.find(query)
            .populate('car', 'brand model licensePlate category dailyRate imageUrl')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Booking.countDocuments(query);

        res.json({
            success: true,
            data: bookings,
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
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('car', 'brand model licensePlate category dailyRate imageUrl features');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.json({
            success: true,
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking',
            error: error.message
        });
    }
});

// Get bookings by email
router.get('/customer/:email', async (req, res) => {
    try {
        const bookings = await Booking.find({ 'customer.email': req.params.email })
            .populate('car', 'brand model licensePlate category dailyRate imageUrl')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customer bookings',
            error: error.message
        });
    }
});

// Create new booking
router.post('/', validateBooking, async (req, res) => {
    try {
        const { carId, customer, rental, notes } = req.body;

        // Check if car exists and is available
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        if (car.status !== 'Available') {
            return res.status(400).json({
                success: false,
                message: 'Car is not available for booking'
            });
        }

        // Check for conflicting bookings
        const conflictingBookings = await Booking.find({
            car: carId,
            status: { $in: ['Confirmed', 'Active'] },
            $or: [
                {
                    'rental.startDate': { $lte: new Date(rental.endDate) },
                    'rental.endDate': { $gte: new Date(rental.startDate) }
                }
            ]
        });

        if (conflictingBookings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Car is not available for the selected dates'
            });
        }

        // Calculate pricing
        const startDate = moment(rental.startDate);
        const endDate = moment(rental.endDate);
        const totalDays = endDate.diff(startDate, 'days') || 1;
        const baseAmount = totalDays * car.dailyRate;
        const taxes = baseAmount * 0.1; // 10% tax
        const fees = 25; // Fixed processing fee
        const totalAmount = baseAmount + taxes + fees;

        // Create booking
        const booking = new Booking({
            car: carId,
            customer,
            rental: {
                ...rental,
                startDate: new Date(rental.startDate),
                endDate: new Date(rental.endDate),
                pickupLocation: rental.pickupLocation || 'Main Branch',
                returnLocation: rental.returnLocation || 'Main Branch'
            },
            pricing: {
                dailyRate: car.dailyRate,
                totalDays,
                baseAmount,
                taxes,
                fees,
                totalAmount
            },
            notes: {
                customerNotes: notes?.customerNotes || ''
            }
        });

        await booking.save();

        // Update car status
        car.status = 'Rented';
        await car.save();

        // Populate car details for response
        await booking.populate('car', 'brand model licensePlate category dailyRate imageUrl');

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating booking',
            error: error.message
        });
    }
});

// Update booking status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        const oldStatus = booking.status;
        booking.status = status;

        // Handle car status updates based on booking status
        const car = await Car.findById(booking.car);

        if (status === 'Active' && oldStatus === 'Confirmed') {
            // Car picked up
            car.status = 'Rented';
        } else if (status === 'Completed') {
            // Car returned
            car.status = 'Available';
            booking.rental.actualReturnDate = new Date();
        } else if (status === 'Cancelled') {
            // Booking cancelled
            car.status = 'Available';
        }

        await booking.save();
        await car.save();

        await booking.populate('car', 'brand model licensePlate category dailyRate imageUrl');

        res.json({
            success: true,
            message: 'Booking status updated successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating booking status',
            error: error.message
        });
    }
});

// Cancel booking
router.put('/:id/cancel', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (!['Confirmed'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Booking cannot be cancelled in current status'
            });
        }

        booking.status = 'Cancelled';
        booking.notes.adminNotes = `Cancelled at ${new Date().toISOString()}`;

        // Update car status back to available
        const car = await Car.findById(booking.car);
        car.status = 'Available';

        await booking.save();
        await car.save();

        await booking.populate('car', 'brand model licensePlate category dailyRate imageUrl');

        res.json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cancelling booking',
            error: error.message
        });
    }
});

// Mark car as returned
router.put('/:id/return', async (req, res) => {
    try {
        const { damageNotes, adminNotes } = req.body;
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        if (!['Confirmed', 'Active'].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking status for return'
            });
        }

        booking.status = 'Completed';
        booking.rental.actualReturnDate = new Date();
        booking.notes.damageNotes = damageNotes || '';
        booking.notes.adminNotes = adminNotes || `Returned at ${new Date().toISOString()}`;

        // Update car status back to available
        const car = await Car.findById(booking.car);
        car.status = 'Available';

        await booking.save();
        await car.save();

        await booking.populate('car', 'brand model licensePlate category dailyRate imageUrl');

        res.json({
            success: true,
            message: 'Car returned successfully',
            data: booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing car return',
            error: error.message
        });
    }
});

// Get booking statistics
router.get('/stats/dashboard', async (req, res) => {
    try {
        const [
            totalBookings,
            activeBookings,
            completedBookings,
            cancelledBookings,
            revenue
        ] = await Promise.all([
            Booking.countDocuments(),
            Booking.countDocuments({ status: { $in: ['Confirmed', 'Active'] } }),
            Booking.countDocuments({ status: 'Completed' }),
            Booking.countDocuments({ status: 'Cancelled' }),
            Booking.aggregate([
                { $match: { status: 'Completed' } },
                { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
            ])
        ]);

        // Monthly booking trends
        const monthlyStats = await Booking.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    bookings: { $sum: 1 },
                    revenue: { $sum: '$pricing.totalAmount' }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalBookings,
                    activeBookings,
                    completedBookings,
                    cancelledBookings,
                    totalRevenue: revenue[0]?.total || 0
                },
                monthlyStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking statistics',
            error: error.message
        });
    }
});

module.exports = router;


// Booking Models


const bookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        unique: true,
        required: true
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    customer: {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            lowercase: true,
            trim: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        license: {
            number: String,
            expiryDate: Date
        }
    },
    rental: {
        startDate: {
            type: Date,
            required: [true, 'Start date is required']
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required']
        },
        actualReturnDate: Date,
        pickupLocation: {
            type: String,
            default: 'Main Branch'
        },
        returnLocation: {
            type: String,
            default: 'Main Branch'
        }
    },
    pricing: {
        dailyRate: {
            type: Number,
            required: true
        },
        totalDays: {
            type: Number,
            required: true,
            min: 1
        },
        baseAmount: {
            type: Number,
            required: true
        },
        taxes: {
            type: Number,
            default: 0
        },
        fees: {
            type: Number,
            default: 0
        },
        totalAmount: {
            type: Number,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['Confirmed', 'Active', 'Completed', 'Cancelled', 'No-Show'],
        default: 'Confirmed'
    },
    payment: {
        method: {
            type: String,
            enum: ['Credit Card', 'Debit Card', 'Cash', 'Online'],
            default: 'Credit Card'
        },
        status: {
            type: String,
            enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
            default: 'Pending'
        },
        transactionId: String
    },
    notes: {
        customerNotes: String,
        adminNotes: String,
        damageNotes: String
    }
}, {
    timestamps: true
});

// Generate booking ID before saving
bookingSchema.pre('save', async function (next) {
    if (!this.bookingId) {
        const count = await mongoose.model('Booking').countDocuments();
        this.bookingId = `CR${Date.now()}${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

// Indexes for efficient queries
bookingSchema.index({ 'customer.email': 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ 'rental.startDate': 1, 'rental.endDate': 1 });
bookingSchema.index({ car: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

