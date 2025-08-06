// API Configuration
const API_BASE_URL = 'http://localhost:8000/api';

// Global state
let selectedCar = null;
let bookingData = null;

// Initialize booking page
document.addEventListener('DOMContentLoaded', function () {
    initializeBookingPage();
});

async function initializeBookingPage() {
    try {
        // Get car ID from session storage
        const carId = sessionStorage.getItem('selectedCarId');
        if (!carId) {
            showError('No car selected. Redirecting to home page...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
            return;
        }

        // Load car details
        await loadCarDetails(carId);

        // Setup form handlers
        setupFormHandlers();

        // Pre-fill dates if available
        prefillDates();

        // Initial cost calculation
        updateCostCalculation();

    } catch (error) {
        console.error('Error initializing booking page:', error);
        showError('Failed to load booking page');
    }
}

async function loadCarDetails(carId) {
    try {
        const response = await fetch(`${API_BASE_URL}/cars/${carId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            selectedCar = result.data;
            displayCarDetails(selectedCar);
        } else {
            throw new Error(result.message || 'Failed to load car details');
        }
    } catch (error) {
        console.error('Error loading car details:', error);
        showError('Failed to load car details');

        // Redirect back to home after error
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
    }
}

function displayCarDetails(car) {
    const carDetailsContainer = document.getElementById('carDetails');
    if (!carDetailsContainer) return;

    const features = car.features && car.features.length > 0
        ? car.features.map(feature => `<span class="feature-tag">${feature}</span>`).join('')
        : '<span class="feature-tag">Standard Features</span>';

    carDetailsContainer.innerHTML = `
        <div class="car-image-section">
            ${car.imageUrl ?
            `<img src="${car.imageUrl}" alt="${car.brand} ${car.model}" class="car-preview-image">` :
            '<div class="car-preview-placeholder"><i class="fas fa-car"></i></div>'
        }
        </div>
        <div class="car-info-section">
            <h4>${car.brand} ${car.model} (${car.year})</h4>
            <p class="car-category"><i class="fas fa-tag"></i> ${car.category}</p>
            <p class="car-license"><i class="fas fa-id-card"></i> ${car.licensePlate}</p>
            
            <div class="car-specs">
                <div class="spec-item">
                    <i class="fas fa-users"></i>
                    <span>${car.seats} Seats</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-cog"></i>
                    <span>${car.transmission}</span>
                </div>
                <div class="spec-item">
                    <i class="fas fa-gas-pump"></i>
                    <span>${car.fuelType}</span>
                </div>
            </div>
            
            <div class="car-features">
                ${features}
            </div>
            
            <div class="car-rate">
                <strong>$${car.dailyRate}/day</strong>
            </div>
            
            <div class="car-status available">
                <i class="fas fa-check-circle"></i> Available
            </div>
        </div>
    `;

    // Update daily rate in pricing
    const dailyRateElement = document.getElementById('dailyRate');
    if (dailyRateElement) {
        dailyRateElement.textContent = `$${car.dailyRate.toFixed(2)}`;
    }
}

function setupFormHandlers() {
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    // Date change handlers for cost calculation
    const pickupDate = document.getElementById('pickupDate');
    const returnDate = document.getElementById('returnDate');

    if (pickupDate) {
        pickupDate.addEventListener('change', updateCostCalculation);
    }

    if (returnDate) {
        returnDate.addEventListener('change', updateCostCalculation);
    }

    // Real-time form validation
    const requiredFields = ['customerName', 'customerEmail', 'customerPhone'];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', validateField);
            field.addEventListener('input', clearFieldError);
        }
    });

    // Email validation
    const emailField = document.getElementById('customerEmail');
    if (emailField) {
        emailField.addEventListener('blur', validateEmail);
    }

    // Phone validation
    const phoneField = document.getElementById('customerPhone');
    if (phoneField) {
        phoneField.addEventListener('input', formatPhoneNumber);
    }
}

function prefillDates() {
    const bookingStartDate = sessionStorage.getItem('bookingStartDate');
    const bookingEndDate = sessionStorage.getItem('bookingEndDate');

    const pickupDateField = document.getElementById('pickupDate');
    const returnDateField = document.getElementById('returnDate');

    if (bookingStartDate && pickupDateField) {
        pickupDateField.value = bookingStartDate;
    }

    if (bookingEndDate && returnDateField) {
        returnDateField.value = bookingEndDate;
    }

    // Set minimum dates
    const now = new Date();
    const minDateTime = formatDateForInput(now);

    if (pickupDateField) {
        pickupDateField.min = minDateTime;

        pickupDateField.addEventListener('change', function () {
            const selectedDate = new Date(this.value);
            const minReturnDate = new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000);

            if (returnDateField) {
                returnDateField.min = formatDateForInput(minReturnDate);

                // Update return date if it's before minimum
                if (returnDateField.value && new Date(returnDateField.value) <= selectedDate) {
                    returnDateField.value = formatDateForInput(minReturnDate);
                }
            }
        });
    }

    if (returnDateField && pickupDateField && pickupDateField.value) {
        const pickupDate = new Date(pickupDateField.value);
        const minReturnDate = new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000);
        returnDateField.min = formatDateForInput(minReturnDate);
    }
}

function updateCostCalculation() {
    const pickupDate = document.getElementById('pickupDate')?.value;
    const returnDate = document.getElementById('returnDate')?.value;

    if (!pickupDate || !returnDate || !selectedCar) {
        resetPricing();
        return;
    }

    const startDate = new Date(pickupDate);
    const endDate = new Date(returnDate);

    if (endDate <= startDate) {
        resetPricing();
        showFieldError('returnDate', 'Return date must be after pickup date');
        return;
    }

    // Calculate days
    const timeDiff = endDate.getTime() - startDate.getTime();
    const totalDays = Math.ceil(timeDiff);
}