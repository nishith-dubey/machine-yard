// Utility functions
function showError(message) {
    alert(message);
}

function checkAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
        window.location.href = '/login.html';
        return null;
    }
    return { token, role };
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login.html';
}

function renderMachines(machines, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = machines.map(machine => `
        <div class="bg-blue-50 p-4 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-2">${machine.name}</h3>
            <p>Type: ${machine.type}</p>
            <p>Location: ${machine.location}</p>
            <p>Hourly Rate: ₹${machine.rentalFeePerHour}</p>
            ${containerId === 'machinesList' ? `
                <button onclick="openBookingModal('${machine._id}')" 
                    class="mt-2 w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
                    Book Now
                </button>
            ` : ''}
        </div>
    `).join('');
}

async function loadMachines() {
    const auth = checkAuth();
    if (!auth) return;

    const locationInput = document.querySelector('input[name="location"]');
    const typeInput = document.querySelector('select[name="type"]');
    const searchParams = new URLSearchParams();

    if (locationInput.value) searchParams.append('location', locationInput.value);
    if (typeInput.value) searchParams.append('type', typeInput.value);

    try {
        const response = await fetch(`/api/machines?${searchParams}`, {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const machines = await response.json();
        renderMachines(machines, 'machinesList');
    } catch (error) {
        showError('Failed to load machines');
    }
}

async function loadOwnerMachines() {
    const auth = checkAuth();
    if (!auth || auth.role !== 'owner') return;

    document.getElementById('ownerSection').classList.remove('hidden');

    try {
        const response = await fetch('/api/machines1/owner1', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const machines = await response.json();
        renderMachines(machines, 'ownerMachinesList');
    } catch (error) {
        showError('Failed to load owner machines');
    }
}

async function loadPendingMachines() {
    const auth = checkAuth();
    if (!auth || auth.role !== 'admin') return;

    document.getElementById('adminSection').classList.remove('hidden');

    try {
        const response = await fetch('/api/machines/pending', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const machines = await response.json();
        const container = document.getElementById('pendingVerificationsList');
        container.innerHTML = machines.map(machine => `
            <div class="bg-yellow-50 p-4 rounded-lg mb-4 flex justify-between items-center">
                <div>
                    <h3 class="text-xl font-bold">${machine.name}</h3>
                    <p>Reg No: ${machine.regNo}</p>
                </div>
                <button onclick="verifyMachine('${machine._id}')" 
                    class="bg-green-600 text-white px-4 py-2 rounded-md">
                    Verify
                </button>
            </div>
        `).join('');
    } catch (error) {
        showError('Failed to load pending machines');
    }
}

async function verifyMachine(machineId) {
    const auth = checkAuth();
    if (!auth || auth.role !== 'admin') return;

    try {
        const response = await fetch(`/api/machines/verify/${machineId}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${auth.token}`,
                'Content-Type': 'application/json'
            }
        });
        if (response.ok) {
            alert('Machine verified successfully');
            loadPendingMachines();
        }
    } catch (error) {
        showError('Machine verification failed');
    }
}

function openBookingModal(machineId) {
    const auth = checkAuth();
    if (!auth) return;

    document.getElementById('bookingModal').classList.remove('hidden');
    document.querySelector('input[name="machineId"]').value = machineId;
}

async function submitBooking(event) {
    event.preventDefault();
    const auth = checkAuth();
    if (!auth) return;

    const formData = new FormData(event.target);
    const data = {
        machineId: formData.get('machineId'),
        hours: calculateHours(formData.get('startTime'), formData.get('endTime'))
    };

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${auth.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert('Booking request sent!');
            hideBookingModal();
            loadUserBookings();
        } else {
            showError(result.error);
        }
    } catch (error) {
        showError('Booking failed');
    }
}

function calculateHours(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.ceil((end - start) / (1000 * 60 * 60));
}

function hideBookingModal() {
    document.getElementById('bookingModal').classList.add('hidden');
}

async function loadUserBookings() {
    const auth = checkAuth();
    if (!auth) return;

    try {
        const response = await fetch('/api/bookings/user', {
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });
        const bookings = await response.json();
        const container = document.getElementById('bookingsList');
        container.innerHTML = bookings.map(booking => `
            <div class="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 class="text-xl font-bold">${booking.machine.name}</h3>
                <p>Hours: ${booking.hours}</p>
                <p>Total Cost: ₹${booking.totalCost}</p>
                <p>Status: ${booking.ownerVerified}</p>
                ${booking.ownerVerified === 'yes' && !booking.isCancelled ? `
                    <button onclick="cancelBooking('${booking._id}')" 
                        class="mt-2 bg-red-600 text-white px-4 py-2 rounded-md">
                        Cancel Booking
                    </button>
                ` : ''}
            </div>
        `).join('');
    } catch (error) {
        showError('Failed to load bookings');
    }
}

async function cancelBooking(bookingId) {
    const auth = checkAuth();
    if (!auth) return;

    try {
        const response = await fetch(`/api/bookings/cancel/${bookingId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        });

        const result = await response.json();
        if (response.ok) {
            alert('Booking canceled successfully');
            loadUserBookings();
        } else {
            showError(result.error);
        }
    } catch (error) {
        showError('Cancellation failed');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const auth = checkAuth();
    if (!auth) return;

    document.getElementById('userRole').textContent = auth.role.toUpperCase();
    
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            loadMachines();
        });
    }

    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', submitBooking);
    }

    loadMachines();
    loadOwnerMachines();
    loadPendingMachines();
    loadUserBookings();
});