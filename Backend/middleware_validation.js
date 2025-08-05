const Joi = require('joi');

// Car validation schema
const carValidationSchema = Joi.object({
    brand: Joi.string().required().trim(),
    model: Joi.string().required().trim(),
    year: Joi.number().integer().min(2000).max(new Date().getFullYear() + 1).required(),
    licensePlate: Joi.string().required().trim(),
    category: Joi.string().valid('Economy', 'Compact', 'SUV', 'Luxury', 'Sports').required(),
    dailyRate: Joi.number().positive().required(),
    features: Joi.array().items(Joi.string()),
    fuelType: Joi.string().valid('Petrol', 'Diesel', 'Electric', 'Hybrid'),
    transmission: Joi.string().valid('Manual', 'Automatic'),
    seats: Joi.number().integer().min(2).max(8),
    imageUrl: Joi.string().uri().allow(null),
    location: Joi.string(),
    mileage: Joi.number().min(0)
});

// Booking validation schema
const bookingValidationSchema = Joi.object({
    carId: Joi.string().required(),
    customer: Joi.object({
        name: Joi.string().required().trim(),
        email: Joi.string().email().required(),
        phone: Joi.string().required().trim(),
        license: Joi.object({
            number: Joi.string(),
            expiryDate: Joi.date()
        })
    }).required(),
    rental: Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().greater(Joi.ref('startDate')).required(),
        pickupLocation: Joi.string(),
        returnLocation: Joi.string()
    }).required(),
    notes: Joi.object({
        customerNotes: Joi.string().allow('')
    })
});

const validateCar = (req, res, next) => {
    const { error } = carValidationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
    }
    next();
};

const validateBooking = (req, res, next) => {
    const { error } = bookingValidationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            details: error.details[0].message
        });
    }
    next();
};

module.exports = {
    validateCar,
    validateBooking
};
