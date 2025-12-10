/* =====================================
   CONFIG
===================================== */
const API_BASE = window.location.origin + '/api';

/* =====================================
   API UTILITIES
===================================== */
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function getBookings() {
    return await apiCall('/bookings');
}

async function createBooking(bookingData) {
    return await apiCall('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
    });
}

async function deleteBooking(bookingId) {
    return await apiCall(`/bookings/${bookingId}`, {
        method: 'DELETE'
    });
}

async function searchBookings(email, phone) {
    return await apiCall('/bookings/search', {
        method: 'POST',
        body: JSON.stringify({ email, phone })
    });
}

async function adminLogin(username, password) {
    return await apiCall('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
}

async function getStats() {
    return await apiCall('/stats');
}

/* =====================================
   UTILITIES
===================================== */
function formatTime(time) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/* =====================================
   MOBILE MENU
===================================== */
function toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
}

/* =====================================
   ADMIN AUTH
===================================== */
function isLoggedIn() {
    return localStorage.getItem('adminLoggedIn') === 'true';
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    window.location.href = 'login.html';
}

/* =====================================
   LOGIN
===================================== */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        try {
            const result = await adminLogin(username, password);
            if (result.success) {
                localStorage.setItem('adminLoggedIn', 'true');
                window.location.href = 'admin.html';
            }
        } catch (error) {
            showError('Invalid username or password');
        }
    });
}

function showError(msg) {
    const box = document.getElementById('errorMessage');
    const text = document.getElementById('errorText');
    if (!box || !text) return;
    text.textContent = msg;
    box.classList.remove('hidden');
    setTimeout(() => box.classList.add('hidden'), 3000);
}

function togglePassword() {
    const input = document.getElementById('password');
    const icon = document.getElementById('eyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

/* =====================================
   BOOKING FORM
===================================== */
const bookingForm = document.getElementById('bookingForm');
if (bookingForm) {
    const dateInput = document.getElementById('appointmentDate');
    if (dateInput) {
        dateInput.min = new Date().toISOString().split('T')[0];
        dateInput.addEventListener('change', () => {
            const day = new Date(dateInput.value + 'T00:00:00')
                .toLocaleDateString('en-US', { weekday: 'long' });
            document.getElementById('dayOfWeek').textContent = `Selected day: ${day}`;
        });
    }

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bookingData = {
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            numberOfPeople: document.getElementById('numberOfPeople').value,
            details: document.getElementById('appointmentDetails').value
        };

        try {
            const booking = await createBooking(bookingData);
            showConfirmation(booking);
            bookingForm.reset();
        } catch (error) {
            alert('Error creating booking: ' + error.message);
        }
    });
}

/* =====================================
   CONFIRMATION MODAL
===================================== */
function showConfirmation(booking) {
    const modal = document.getElementById('confirmationModal');
    const box = document.getElementById('confirmationDetails');
    if (!modal || !box) return;

    box.innerHTML = `
      <p><b>Name:</b> ${booking.name}</p>
      <p><b>Date:</b> ${formatDate(booking.date)}</p>
      <p><b>Time:</b> ${formatTime(booking.time)}</p>
      <p><b>People:</b> ${booking.numberOfPeople}</p>
      <p><b>Email:</b> ${booking.email}</p>
      <p><b>Phone:</b> ${booking.phone}</p>
      <p><b>Details:</b> ${booking.details}</p>
    `;
    modal.classList.remove('hidden');
}

/* =====================================
   ADMIN DASHBOARD
===================================== */
if (location.pathname.includes('admin.html')) {
    if (!isLoggedIn()) {
        location.href = 'login.html';
    } else {
        loadAdmin();
    }
}

async function loadAdmin() {
    try {
        // Load stats
        const stats = await getStats();
        document.getElementById('totalBookings').textContent = stats.total_bookings;
        document.getElementById('todayBookings').textContent = stats.today_bookings;
        document.getElementById('totalPeople').textContent = stats.total_people;

        // Load bookings table
        const bookings = await getBookings();
        renderAdminTable(bookings);
    } catch (error) {
        console.error('Error loading admin data:', error);
        alert('Error loading admin data');
    }
}

function renderAdminTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    if (!bookings.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-6">No bookings</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td>#${b.id}</td>
        <td>${b.name}</td>
        <td>${formatDate(b.date)}<br><b>${formatTime(b.time)}</b></td>
        <td>${b.numberOfPeople}</td>
        <td>${b.email}<br>${b.phone}</td>
        <td>${b.details}</td>
        <td><button onclick="deleteBookingAdmin(${b.id})" class="text-red-600 hover:text-red-800">🗑️</button></td>
      </tr>
    `).join('');
}

async function deleteBookingAdmin(id) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    
    try {
        await deleteBooking(id);
        loadAdmin(); // Reload the admin panel
    } catch (error) {
        alert('Error deleting booking: ' + error.message);
    }
}

/* =====================================
   SEARCH (My Bookings)
===================================== */
async function searchBookings() {
    const emailVal = document.getElementById('searchEmail').value.trim();
    const phoneVal = document.getElementById('searchPhone').value.trim();
    
    if (!emailVal && !phoneVal) {
        alert('Please enter email or phone number');
        return;
    }

    try {
        const results = await searchBookings(emailVal, phoneVal);
        displayUserBookings(results);
    } catch (error) {
        console.error('Search error:', error);
        displayUserBookings([]);
    }
}

function displayUserBookings(list) {
    const table = document.getElementById('userBookingsTable');
    const cards = document.getElementById('userBookingsCards');
    const noResults = document.getElementById('noResults');
    const searchResults = document.getElementById('searchResults');

    // Hide no results initially
    if (noResults) noResults.classList.add('hidden');
    
    if (!list.length) {
        if (noResults) noResults.classList.remove('hidden');
        if (searchResults) searchResults.classList.add('hidden');
        return;
    }

    // Show results
    if (searchResults) searchResults.classList.remove('hidden');

    // Desktop table
    if (table) {
        table.innerHTML = list.map(b => `
          <tr>
            <td>#${b.id}</td>
            <td>${formatDate(b.date)}<br>${formatTime(b.time)}</td>
            <td>${b.numberOfPeople}</td>
            <td>${b.details}</td>
            <td>Confirmed</td>
          </tr>
        `).join('');
    }

    // Mobile cards
    if (cards) {
        cards.innerHTML = list.map(b => `
          <div class="booking-card">
            <div class="booking-card-header">
              <b>#${b.id}</b>
              <span class="text-green-600">Confirmed</span>
            </div>
            <div class="booking-field">
              <span class="booking-field-label">Date & Time:</span>
              <span class="booking-field-value">${formatDate(b.date)} ${formatTime(b.time)}</span>
            </div>
            <div class="booking-field">
              <span class="booking-field-label">People:</span>
              <span class="booking-field-value">${b.numberOfPeople}</span>
            </div>
            <div class="booking-field">
              <span class="booking-field-label">Details:</span>
              <span class="booking-field-value">${b.details}</span>
            </div>
          </div>
        `).join('');
    }
}

// Fix the search function name conflict
window.searchUserBookings = async function() {
    const emailVal = document.getElementById('searchEmail').value.trim();
    const phoneVal = document.getElementById('searchPhone').value.trim();
    
    if (!emailVal && !phoneVal) {
        alert('Please enter email or phone number');
        return;
    }

    try {
        const results = await apiCall('/bookings/search', {
            method: 'POST',
            body: JSON.stringify({ email: emailVal, phone: phoneVal })
        });
        displayUserBookings(results);
    } catch (error) {
        console.error('Search error:', error);
        displayUserBookings([]);
    }
};