// utils_helpers.js

// Helper: Generate Booking ID
exports.generateBookingID = () => {
    return "CR" + Date.now().toString(36) + Math.floor(Math.random() * 1000);
};

// Helper: Date Overlap Checker
exports.datesOverlap = function (aStart, aEnd, bStart, bEnd) {
    return (aStart <= bEnd) && (aEnd >= bStart);
};

// Helper: Simple Email Regex
exports.isValidEmail = function (email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// backend/utils/seedData.js
const mongoose = require('mongoose');
const Car = require('../models_routes_car');
const Booking = require('../models_routes_booking');
const connectDB = require('../config_database');

async function seed() {
    await connectDB();

    await Car.deleteMany({});
    await Booking.deleteMany({});

    const cars = await Car.insertMany([
        {
            brand: "Toyota",
            model: "Corolla",
            year: 2020,
            licensePlate: "TOY100",
            category: "Economy",
            dailyRate: 40,
            status: "Available"
        },
        {
            brand: "Honda",
            model: "Civic",
            year: 2021,
            licensePlate: "HON200",
            category: "Compact",
            dailyRate: 45,
            status: "Available"
        },
        {
            brand: "BMW",
            model: "3 Series",
            year: 2022,
            licensePlate: "BMW300",
            category: "Luxury",
            dailyRate: 120,
            status: "Available"
        }
    ]);

    const bookings = await Booking.insertMany([
        {
            car: cars[0]._id,
            bookingId: 'CRSEED100',
            customer: {
                name: "Alice",
                email: "alice@example.com",
                phone: "1234567890"
            },
            rental: {
                startDate: new Date(Date.now() + 86400000),
                endDate: new Date(Date.now() + 4 * 86400000)
            },
            pricing: {
                dailyRate: cars[0].dailyRate,
                totalDays: 3,
                baseAmount: 120,
                taxes: 12,
                fees: 25,
                totalAmount: 157
            },
            status: "Confirmed"
        }
    ]);

    console.log("✅ Seed data inserted.");
    process.exit(0);
}

seed();
