// js/admin.js
const API_URL = 'http://localhost:8000/api';

let editingCarId = null;

document.addEventListener('DOMContentLoaded', () => {
    showTab('cars');
    loadCars();
    loadBookings();

    document.getElementById('carForm').onsubmit = saveCar;
});

function showTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    if (tab === 'cars') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        document.getElementById('carsTab').classList.add('active');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        document.getElementById('bookingsTab').classList.add('active');
    }
}

function loadCars() {
    fetch(`${API_URL}/cars`)
        .then(res => res.json())
        .then(({ data }) => {
            const container = document.getElementById('carsTable');
            container.innerHTML = `<table>
            <thead><tr>
                <th>ID</th><th>Brand</th><th>Model</th>
                <th>Year</th><th>License</th><th>Category</th>
                <th>Rate</th><th>Status</th><th></th>
            </tr></thead><tbody>
            ${data.map(car => `
                <tr>
                    <td>${car._id}</td>
                    <td>${car.brand}</td>
                    <td>${car.model}</td>
                    <td>${car.year}</td>
                    <td>${car.licensePlate}</td>
                    <td>${car.category}</td>
                    <td>$${car.dailyRate}</td>
                    <td>${car.status}</td>
                    <td>
                        <button onclick="editCar('${car._id}')">Edit</button>
                        <button onclick="deleteCar('${car._id}')">Delete</button>
                    </td>
                </tr>
            `).join('')}</tbody></table>`;
        });
}

function showCarForm(car = {}) {
    editingCarId = car._id || null;
    document.getElementById('carFormContainer').style.display = 'block';
    document.getElementById('carId').value = editingCarId || '';
    document.getElementById('brand').value = car.brand || '';
    document.getElementById('model').value = car.model || '';
    document.getElementById('year').value = car.year || '';
    document.getElementById('licensePlate').value = car.licensePlate || '';
    document.getElementById('dailyRate').value = car.dailyRate || '';
    document.getElementById('category').value = car.category || '';
    document.getElementById('imageUrl').value = car.imageUrl || '';
}
function hideCarForm() {
    document.getElementById('carForm').reset();
    document.getElementById('carFormContainer').style.display = 'none';
    editingCarId = null;
}
function editCar(id) {
    fetch(`${API_URL}/cars/${id}`).then(res => res.json())
        .then(({ data }) => showCarForm(data));
}
function saveCar(e) {
    e.preventDefault();
    const isEdit = !!editingCarId;
    const car = {
        brand: document.getElementById('brand').value,
        model: document.getElementById('model').value,
        year: parseInt(document.getElementById('year').value),
        licensePlate: document.getElementById('licensePlate').value,
        category: document.getElementById('category').value,
        dailyRate: parseFloat(document.getElementById('dailyRate').value),
        imageUrl: document.getElementById('imageUrl').value
    };
    fetch(`${API_URL}/cars${isEdit ? '/' + editingCarId : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(car)
    })
        .then(res => res.json())
        .then(() => {
            hideCarForm();
            loadCars();
        });
}
function deleteCar(id) {
    if (!confirm('Delete this car?')) return;
    fetch(`${API_URL}/cars/${id}`, { method: 'DELETE' })
        .then(() => loadCars());
}

// BOOKINGS
function loadBookings() {
    fetch(`${API_URL}/bookings?limit=100`)
        .then(res => res.json())
        .then(({ data }) => {
            const container = document.getElementById('bookingsTable');
            container.innerHTML = `<table>
            <thead><tr>
                <th>ID</th><th>Car</th><th>Customer</th><th>Dates</th>
                <th>Amount</th><th>Status</th><th></th>
            </tr></thead><tbody>
            ${data.map(b => `
                <tr>
                    <td>${b.bookingId || b._id}</td>
                    <td>${b.car?.brand || ''} ${b.car?.model || ''}</td>
                    <td>${b.customer?.name}<br>${b.customer?.email}</td>
                    <td>
                        ${new Date(b.rental?.startDate).toLocaleDateString()}<br>
                        ${new Date(b.rental?.endDate).toLocaleDateString()}
                    </td>
                    <td>$${b.pricing?.totalAmount || ''}</td>
                    <td>${b.status}</td>
                    <td>
                        ${b.status !== 'Completed' ? `<button onclick="markReturned('${b._id}')">Return</button>` : ''}
                        ${b.status === 'Confirmed' ? `<button onclick="cancelBooking('${b._id}')">Cancel</button>` : ''}
                    </td>
                </tr>
            `).join('')}</tbody></table>`;
        });
}
function markReturned(id) {
    if (!confirm('Mark this booking as returned?')) return;
    fetch(`${API_URL}/bookings/${id}/return`, { method: 'PUT' })
        .then(() => loadBookings());
}
function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;
    fetch(`${API_URL}/bookings/${id}/cancel`, { method: 'PUT' })
        .then(() => loadBookings());
}
