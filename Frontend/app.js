// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentPage = 1;
let isLoading = false;
let allCars = [];
let filteredCars = [];

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

async function initializeApp() {
    try {
        // Load initial cars
        await loadCars();

        // Setup event listeners
        setupEventListeners();

        // Load stats
        await loadStats();

        // Set minimum date to today
        setMinimumDates();

    } catch (error) {
        console.error('Error initializing app:', error);
        showError('Failed to initialize application');
    }
}

function setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }

    // Filter changes
    const filters = ['categoryFilter', 'transmissionFilter', 'fuelFilter', 'seatsFilter', 'budgetFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });

    // Load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreCars);
    }

    // View toggle
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', toggleView);
    });

    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

function setMinimumDates() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput) {
        startDateInput.min = formatDateForInput(now);
        startDateInput.value = formatDateForInput(tomorrow);
    }

    if (endDateInput) {
        const dayAfterTomorrow = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
        endDateInput.min = formatDateForInput(tomorrow);
        endDateInput.value = formatDateForInput(dayAfterTomorrow);
    }

    // Update end date minimum when start date changes
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', function () {
            const selectedStart = new Date(this.value);
            const minEnd = new Date(selectedStart.getTime() + 24 * 60 * 60 * 1000);
            endDateInput.min = formatDateForInput(minEnd);

            if (new Date(endDateInput.value) <= selectedStart) {
                endDateInput.value = formatDateForInput(minEnd);
            }
        });
    }
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function loadCars(reset = true) {
    if (isLoading) return;

    isLoading = true;
    const loadingState = document.getElementById('loadingState');
    const carsGrid = document.getElementById('carsGrid');

    if (reset) {
        currentPage = 1;
        if (loadingState) loadingState.style.display = 'block';
        if (carsGrid) carsGrid.innerHTML = '';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cars?page=${currentPage}&limit=12`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            if (reset) {
                allCars = result.data;
            } else {
                allCars = [...allCars, ...result.data];
            }

            filteredCars = [...allCars];
            displayCars(filteredCars);

            // Show/hide load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                if (result.pagination.page < result.pagination.pages) {
                    loadMoreBtn.style.display = 'block';
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            }
        } else {
            throw new Error(result.message || 'Failed to load cars');
        }
    } catch (error) {
        console.error('Error loading cars:', error);
        showError('Failed to load cars. Please try again.');

        if (carsGrid) {
            carsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load cars. Please check your connection and try again.</p>
                    <button onclick="loadCars()" class="btn-primary">Retry</button>
                </div>
            `;
        }
    } finally {
        isLoading = false;
        if (loadingState) loadingState.style.display = 'none';
    }
}

async function loadMoreCars() {
    if (isLoading) return;

    currentPage++;
    await loadCars(false);
}

function displayCars(cars) {
    const carsGrid = document.getElementById('carsGrid');
    if (!carsGrid) return;

    if (cars.length === 0) {
        carsGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-car" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No cars found</h3>
                <p>Try adjusting your search criteria or filters.</p>
                <button onclick="clearFilters()" class="btn-primary">Clear Filters</button>
            </div>
        `;
        return;
    }

    carsGrid.innerHTML = cars.map(car => createCarCard(car)).join('');
}

function createCarCard(car) {
    const features = car.features && car.features.length > 0
        ? car.features.slice(0, 3).map(feature => `<span class="feature-tag">${feature}</span>`).join('')
        : '<span class="feature-tag">Standard Features</span>';

    return `
        <div class="car-card" data-car-id="${car._id}">
            <div class="car-image">
                ${car.imageUrl ?
            `<img src="${car.imageUrl}" alt="${car.brand} ${car.model}" loading="lazy">` :
            '<i class="fas fa-car"></i>'
        }
                <div class="car-status ${car.status.toLowerCase()}">${car.status}</div>
            </div>
            <div class="car-info">
                <h3>${car.brand} ${car.model}</h3>
                <div class="car-details">
                    <span><i class="fas fa-calendar"></i> ${car.year}</span>
                    <span><i class="fas fa-tag"></i> ${car.category}</span>
                    <span><i class="fas fa-users"></i> ${car.seats} seats</span>
                </div>
                <div class="car-features">
                    ${features}
                </div>
                <div class="car-specs">
                    <span><i class="fas fa-cog"></i> ${car.transmission}</span>
                    <span><i class="fas fa-gas-pump"></i> ${car.fuelType}</span>
                </div>
                <div class="car-price">
                    $${car.dailyRate}<span class="period">/day</span>
                </div>
                <button class="book-car-btn" onclick="bookCar('${car._id}')" 
                    ${car.status !== 'Available' ? 'disabled' : ''}>
                    <i class="fas fa-calendar-check"></i>
                    ${car.status === 'Available' ? 'Book Now' : 'Unavailable'}
                </button>
            </div>
        </div>
    `;
}

async function handleSearch(e) {
    e.preventDefault();

    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const category = document.getElementById('categoryFilter').value;

    if (!startDate || !endDate) {
        showError('Please select both pickup and return dates');
        return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
        showError('Return date must be after pickup date');
        return;
    }

    try {
        isLoading = true;
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'block';

        let url = `${API_BASE_URL}/cars/available/${startDate}/${endDate}`;
        const params = new URLSearchParams();

        if (category) params.append('category', category);

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            allCars = result.data;
            filteredCars = [...allCars];
            applyFilters(); // Apply any existing filters

            // Store search dates for booking
            sessionStorage.setItem('searchStartDate', startDate);
            sessionStorage.setItem('searchEndDate', endDate);

            // Scroll to results
            document.querySelector('.cars-section').scrollIntoView({
                behavior: 'smooth'
            });
        } else {
            throw new Error(result.message || 'Search failed');
        }
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed. Please try again.');
    } finally {
        isLoading = false;
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    }
}

function applyFilters() {
    const category = document.getElementById('categoryFilter')?.value || '';
    const transmission = document.getElementById('transmissionFilter')?.value || '';
    const fuel = document.getElementById('fuelFilter')?.value || '';
    const seats = document.getElementById('seatsFilter')?.value || '';
    const budget = document.getElementById('budgetFilter')?.value || '';

    filteredCars = allCars.filter(car => {
        // Category filter
        if (category && car.category !== category) return false;

        // Transmission filter
        if (transmission && car.transmission !== transmission) return false;

        // Fuel type filter
        if (fuel && car.fuelType !== fuel) return false;

        // Seats filter
        if (seats) {
            if (seats === '7' && car.seats < 7) return false;
            if (seats !== '7' && car.seats != seats) return false;
        }

        // Budget filter
        if (budget) {
            const price = car.dailyRate;
            switch (budget) {
                case '0-50':
                    if (price > 50) return false;
                    break;
                case '50-100':
                    if (price <= 50 || price > 100) return false;
                    break;
                case '100-200':
                    if (price <= 100 || price > 200) return false;
                    break;
                case '200+':
                    if (price <= 200) return false;
                    break;
            }
        }

        return true;
    });

    displayCars(filteredCars);
}

function clearFilters() {
    // Reset all filter dropdowns
    const filters = ['categoryFilter', 'transmissionFilter', 'fuelFilter', 'seatsFilter', 'budgetFilter'];
    filters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.value = '';
        }
    });

    // Reset filtered cars to all cars
    filteredCars = [...allCars];
    displayCars(filteredCars);
}

function toggleView(e) {
    const viewButtons = document.querySelectorAll('.view-btn');
    const carsGrid = document.getElementById('carsGrid');
    const view = e.target.closest('.view-btn').dataset.view;

    // Update active button
    viewButtons.forEach(btn => btn.classList.remove('active'));
    e.target.closest('.view-btn').classList.add('active');

    // Update grid class
    if (carsGrid) {
        carsGrid.className = view === 'list' ? 'cars-list' : 'cars-grid';
    }
}

function bookCar(carId) {
    if (!carId) {
        showError('Car ID is required');
        return;
    }

    // Store selected car ID and search dates
    sessionStorage.setItem('selectedCarId', carId);

    // Get search dates if available
    const startDate = sessionStorage.getItem('searchStartDate');
    const endDate = sessionStorage.getItem('searchEndDate');

    if (startDate && endDate) {
        sessionStorage.setItem('bookingStartDate', startDate);
        sessionStorage.setItem('bookingEndDate', endDate);
    }

    // Redirect to booking page
    window.location.href = 'booking.html';
}

async function loadStats() {
    try {
        const [carsResponse, bookingsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/cars`),
            fetch(`${API_BASE_URL}/bookings/stats/dashboard`)
        ]);

        if (carsResponse.ok) {
            const carsResult = await carsResponse.json();
            if (carsResult.success) {
                const totalCarsElement = document.getElementById('totalCars');
                if (totalCarsElement) {
                    totalCarsElement.textContent = carsResult.pagination?.total || carsResult.data.length;
                }
            }
        }

        if (bookingsResponse.ok) {
            const bookingsResult = await bookingsResponse.json();
            if (bookingsResult.success && bookingsResult.data.overview) {
                const happyCustomersElement = document.getElementById('happyCustomers');
                if (happyCustomersElement) {
                    const completedBookings = bookingsResult.data.overview.completedBookings;
                    happyCustomersElement.textContent = `${completedBookings}+`;
                }
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Stats are not critical, so we don't show an error
    }
}

// Utility functions
function showError(message) {
    // Create or update error notification
    let errorNotification = document.getElementById('errorNotification');

    if (!errorNotification) {
        errorNotification = document.createElement('div');
        errorNotification.id = 'errorNotification';
        errorNotification.className = 'error-notification';
        document.body.appendChild(errorNotification);
    }

    errorNotification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button onclick="hideError()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    errorNotification.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    const errorNotification = document.getElementById('errorNotification');
    if (errorNotification) {
        errorNotification.style.display = 'none';
    }
}

function showSuccess(message) {
    // Create or update success notification
    let successNotification = document.getElementById('successNotification');

    if (!successNotification) {
        successNotification = document.createElement('div');
        successNotification.id = 'successNotification';
        successNotification.className = 'success-notification';
        document.body.appendChild(successNotification);
    }

    successNotification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <button onclick="hideSuccess()" class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    successNotification.style.display = 'block';

    // Auto hide after 3 seconds
    setTimeout(() => {
        hideSuccess();
    }, 3000);
}

function hideSuccess() {
    const successNotification = document.getElementById('successNotification');
    if (successNotification) {
        successNotification.style.display = 'none';
    }
}

// Add notification styles
const notificationStyles = `
    .error-notification,
    .success-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: slideInRight 0.3s ease;
        display: none;
    }

    .error-notification {
        background: #f44336;
        color: white;
    }

    .success-notification {
        background: #4CAF50;
        color: white;
    }

    .notification-content {
        display: flex;
        align-items: center;
        padding: 1rem 1.5rem;
        gap: 0.75rem;
    }

    .notification-content i:first-child {
        font-size: 1.2rem;
    }

    .notification-content span {
        flex: 1;
        font-weight: 500;
    }

    .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.25rem;
        border-radius: 4px;
        transition: background-color 0.2s;
    }

    .notification-close:hover {
        background-color: rgba(255,255,255,0.2);
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);
