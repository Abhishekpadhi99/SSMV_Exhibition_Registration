/* =====================================
   CONFIG
===================================== */
const STORAGE_KEY = 'ssmv_bookings';

const ADMIN_CREDENTIALS = {
    username: 'kshatriya302',
    password: '0978'
};

/* =====================================
   UTILITIES
===================================== */
function getBookings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveBookings(bookings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

function generateId() {
    return Date.now();
}

function formatTime(time) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m} ${ampm}`;
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
    loginForm.addEventListener('submit', e => {
        e.preventDefault();

        const u = username.value.trim();
        const p = password.value.trim();

        if (u === ADMIN_CREDENTIALS.username && p === ADMIN_CREDENTIALS.password) {
            localStorage.setItem('adminLoggedIn','true');
            window.location.href = 'admin.html';
        } else {
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
                .toLocaleDateString('en-US',{ weekday:'long' });
            document.getElementById('dayOfWeek').textContent = `Selected day: ${day}`;
        });
    }

    bookingForm.addEventListener('submit', e => {
        e.preventDefault();

        const booking = {
            id: generateId(),
            name: fullName.value,
            email: email.value,
            phone: phone.value,
            date: appointmentDate.value,
            time: appointmentTime.value,
            numberOfPeople: numberOfPeople.value,
            details: appointmentDetails.value,
            status: 'confirmed'
        };

        const bookings = getBookings();
        bookings.push(booking);
        saveBookings(bookings);

        sendConfirmationEmail(booking);
        showConfirmation(booking);
        bookingForm.reset();
    });
}

/* =====================================
   EMAILJS (SAFE)
===================================== */
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';

if (typeof emailjs !== 'undefined' && !EMAILJS_PUBLIC_KEY.includes('YOUR')) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
}

function sendConfirmationEmail(b) {
    if (typeof emailjs === 'undefined' || EMAILJS_PUBLIC_KEY.includes('YOUR')) return;

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: b.email,
        to_name: b.name,
        appointment_date: formatDate(b.date),
        appointment_time: formatTime(b.time),
        number_of_people: b.numberOfPeople,
        appointment_details: b.details,
        phone: b.phone,
        booking_id: b.id
    });
}

/* =====================================
   CONFIRMATION MODAL
===================================== */
function showConfirmation(b) {
    const modal = document.getElementById('confirmationModal');
    const box = document.getElementById('confirmationDetails');
    if (!modal || !box) return;

    box.innerHTML = `
      <p><b>Name:</b> ${b.name}</p>
      <p><b>Date:</b> ${formatDate(b.date)}</p>
      <p><b>Time:</b> ${formatTime(b.time)}</p>
      <p><b>People:</b> ${b.numberOfPeople}</p>
      <p><b>Email:</b> ${b.email}</p>
      <p><b>Phone:</b> ${b.phone}</p>
      <p><b>Details:</b> ${b.details}</p>
    `;
    modal.classList.remove('hidden');
}

/* =====================================
   ADMIN DASHBOARD
===================================== */
if (location.pathname.includes('admin.html')) {
    if (!isLoggedIn()) location.href = 'login.html';
    else loadAdmin();
}

function loadAdmin() {
    const bookings = getBookings();
    const total = bookings.length;
    const today = new Date().toISOString().split('T')[0];

    document.getElementById('totalBookings').textContent = total;
    document.getElementById('todayBookings').textContent =
        bookings.filter(b=>b.date===today).length;
    document.getElementById('totalPeople').textContent =
        bookings.reduce((s,b)=>s+Number(b.numberOfPeople),0);

    renderAdminTable(bookings);
}

function renderAdminTable(bookings) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;

    if (!bookings.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center p-6">No bookings</td></tr>`;
        return;
    }

    tbody.innerHTML = bookings.map(b=>`
      <tr>
        <td>#${b.id}</td>
        <td>${b.name}</td>
        <td>${formatDate(b.date)}<br><b>${formatTime(b.time)}</b></td>
        <td>${b.numberOfPeople}</td>
        <td>${b.email}<br>${b.phone}</td>
        <td>${b.details}</td>
        <td><button onclick="deleteBooking(${b.id})">🗑️</button></td>
      </tr>
    `).join('');
}

function deleteBooking(id) {
    const filtered = getBookings().filter(b => b.id !== id);
    saveBookings(filtered);
    loadAdmin();
}

/* =====================================
   SEARCH (My Bookings)
===================================== */
function searchBookings() {
    const emailVal = searchEmail.value.trim();
    const phoneVal = searchPhone.value.trim();
    const results = getBookings().filter(
        b => b.email === emailVal || b.phone.includes(phoneVal)
    );

    displayUserBookings(results);
}

function displayUserBookings(list) {
    const table = document.getElementById('userBookingsTable');
    const cards = document.getElementById('userBookingsCards');

    if (!list.length) {
        document.getElementById('noResults').classList.remove('hidden');
        return;
    }

    table.innerHTML = list.map(b=>`
      <tr>
        <td>#${b.id}</td>
        <td>${formatDate(b.date)}<br>${formatTime(b.time)}</td>
        <td>${b.numberOfPeople}</td>
        <td>${b.details}</td>
        <td>Confirmed</td>
      </tr>
    `).join('');

    cards.innerHTML = list.map(b=>`
      <div class="booking-card">
        <b>${formatDate(b.date)} - ${formatTime(b.time)}</b>
        <p>${b.details}</p>
      </div>
    `).join('');
}
