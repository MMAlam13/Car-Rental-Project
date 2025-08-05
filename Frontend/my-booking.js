// js/mybookings.js
const API_URL = 'http://localhost:5000/api';

document.getElementById('searchBookingsForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const email = document.getElementById('searchEmail').value;
    fetch(`${API_URL}/bookings/customer/${email}`)
        .then(res => res.json())
        .then(({ data }) => {
            const container = document.getElementById('myBookingsTable');
            if (!data.length) {
                container.innerHTML = `<div class="no-results">No bookings found for <b>${email}</b>.</div>`;
                return;
            }
            container.innerHTML = `<table>
            <thead>
                <tr>
                    <th>BookingID</th><th>Car</th><th>Dates</th><th>Amount</th><th>Status</th>
                </tr>
            </thead>
            <tbody>
            ${data.map(b => `
                <tr>
                    <td>${b.bookingId || b._id}</td>
                    <td>${b.car?.brand || ''} ${b.car?.model || ''}</td>
                    <td>
                        ${new Date(b.rental?.startDate).toLocaleDateString()}<br>
                        ${new Date(b.rental?.endDate).toLocaleDateString()}
                    </td>
                    <td>$${b.pricing?.totalAmount || ''}</td>
                    <td>${b.status}</td>
                </tr>
            `).join('')}</tbody></table>`;
        });
});
