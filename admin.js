/**
 * Wedding Admin - Dashboard JavaScript
 * Handles: navigation, guests CRUD, wishes, settings, export
 */

// ── Guard: redirect if not logged in ──
if (sessionStorage.getItem('wedding_admin_logged_in') !== 'true') {
    window.location.href = 'login.html';
}

// ── Current user ──
const adminUser = sessionStorage.getItem('wedding_admin_user') || 'Admin';
const avatar = document.getElementById('admin-avatar');
const usernameEl = document.getElementById('admin-username');
if (avatar) avatar.textContent = adminUser.charAt(0).toUpperCase();
if (usernameEl) usernameEl.textContent = adminUser;

// ── Active page ──
let currentPage = 'dashboard';

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
function navigate(page) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target page
    const pageEl = document.getElementById(`page-${page}`);
    const navEl = document.getElementById(`nav-${page}`);
    if (pageEl) pageEl.classList.add('active');
    if (navEl) navEl.classList.add('active');

    // Update topbar
    const titles = {
        dashboard: ['Dashboard', 'Ringkasan undangan pernikahan'],
        guests: ['Manajemen Tamu', 'Kelola daftar tamu undangan'],
        wishes: ['Ucapan Tamu', 'Semua ucapan dari tamu undangan'],
        settings: ['Pengaturan', 'Konfigurasi konten undangan'],
    };
    const [title, subtitle] = titles[page] || ['Dashboard', ''];
    setText('topbar-title', title);
    setText('topbar-subtitle', subtitle);

    currentPage = page;

    // Load content
    if (page === 'dashboard') loadDashboard();
    if (page === 'guests') loadGuests();
    if (page === 'wishes') loadWishesAdmin();
    if (page === 'settings') loadSettings();
}

function openPreview() {
    const s = WeddingDB.getSettings();
    window.open(`index.html?to=Preview+Admin`, '_blank');
}

// ════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════
function loadDashboard() {
    const stats = WeddingDB.getGuestStats();
    const wishes = WeddingDB.getWishes();

    // Stat cards
    animateCount('stat-total', stats.total);
    animateCount('stat-hadir', stats.hadir);
    animateCount('stat-tidak', stats.tidak);
    animateCount('stat-wishes', wishes.length);

    // Nav badges
    updateNavBadges();

    // RSVP chart
    const total = stats.total || 1;
    setTimeout(() => {
        setStyle('rsvp-bar-hadir', 'width', `${(stats.hadir / total * 100).toFixed(1)}%`);
        setStyle('rsvp-bar-tidak', 'width', `${(stats.tidak / total * 100).toFixed(1)}%`);
        setStyle('rsvp-bar-pending', 'width', `${(stats.pending / total * 100).toFixed(1)}%`);
    }, 150);

    setText('legend-hadir', stats.hadir);
    setText('legend-tidak', stats.tidak);
    setText('legend-pending', stats.pending);

    // Recent wishes (max 5)
    const recentEl = document.getElementById('recent-wishes');
    if (recentEl) {
        const recent = wishes.slice(0, 5);
        if (recent.length === 0) {
            recentEl.innerHTML = '<p style="color:var(--text-muted);font-size:0.875rem;font-style:italic;padding:1rem 0;">Belum ada ucapan masuk. <button class="btn btn-secondary btn-sm" onclick="navigate(\'wishes\')">+ Tambah Ucapan</button></p>';
        } else {
            recentEl.innerHTML = recent.map(w => `
              <div class="admin-wish-card">
                <div class="admin-wish-header">
                  <span class="admin-wish-name">🌸 ${escapeHtml(w.name)}</span>
                  <span class="badge ${w.rsvp === 'hadir' ? 'badge-hadir' : w.rsvp === 'tidak' ? 'badge-tidak' : 'badge-pending'}">
                    ${w.rsvp === 'hadir' ? '✅ Hadir' : w.rsvp === 'tidak' ? '❌ Tidak' : '⏳ Pending'}
                  </span>
                </div>
                <p class="admin-wish-text">"${escapeHtml(w.wish)}"</p>
                <p class="admin-wish-time">🕐 ${timeAgo(w.createdAt)}</p>
              </div>
            `).join('');
        }
    }

    // Countdown
    startAdminCountdown();
}

function animateCount(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const duration = 800;
    const start = parseInt(el.textContent) || 0;
    const startTime = performance.now();
    function update(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(start + (target - start) * ease);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

let adminCountdownInterval = null;

function startAdminCountdown() {
    if (adminCountdownInterval) clearInterval(adminCountdownInterval);
    const s = WeddingDB.getSettings();
    const target = new Date(`${s.receptionDate}T${s.receptionTime}:00`);

    function tick() {
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) {
            ['adm-cd-days', 'adm-cd-hours', 'adm-cd-minutes', 'adm-cd-seconds'].forEach(id => setText(id, '00'));
            if (adminCountdownInterval) clearInterval(adminCountdownInterval);
            return;
        }
        setText('adm-cd-days', String(Math.floor(diff / 86400000)).padStart(2, '0'));
        setText('adm-cd-hours', String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'));
        setText('adm-cd-minutes', String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'));
        setText('adm-cd-seconds', String(Math.floor((diff % 60000) / 1000)).padStart(2, '0'));
    }
    tick();
    adminCountdownInterval = setInterval(tick, 1000);
}

// ════════════════════════════════════════
// GUESTS
// ════════════════════════════════════════
let allGuests = [];

function loadGuests() {
    allGuests = WeddingDB.getGuests();
    renderGuests(allGuests);
    setText('nav-badge-guests', allGuests.length);
}

function renderGuests(guests) {
    const tbody = document.getElementById('guests-tbody');
    const emptyEl = document.getElementById('guests-empty');
    const table = document.getElementById('guests-table');
    const s = WeddingDB.getSettings();

    if (!guests.length) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        if (table) table.style.display = 'none';
        return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (table) table.style.display = 'table';

    tbody.innerHTML = guests.map((g, i) => {
        const link = `${s.baseUrl}?to=${encodeURIComponent(g.name)}`;
        const badgeClass = g.rsvp === 'hadir' ? 'badge-hadir' : g.rsvp === 'tidak' ? 'badge-tidak' : 'badge-pending';
        const badgeText = g.rsvp === 'hadir' ? '✅ Hadir' : g.rsvp === 'tidak' ? '❌ Tidak Hadir' : '⏳ Pending';
        const dateStr = new Date(g.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

        return `
      <tr>
        <td style="color:var(--text-muted); font-size:0.8rem;">${i + 1}</td>
        <td style="font-weight:600;">🌸 ${escapeHtml(g.name)}</td>
        <td style="color:var(--text-secondary);">${g.phone ? `📱 ${escapeHtml(g.phone)}` : '<span style="color:var(--text-muted);">—</span>'}</td>
        <td><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td>
          <div style="display:flex; align-items:center; gap:6px; max-width:220px;">
            <span style="font-size:0.75rem; color:var(--primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;" title="${link}">${link}</span>
            <button class="btn btn-secondary btn-sm btn-icon" onclick="copyLink('${encodeURIComponent(link)}')" title="Salin Link">📋</button>
            <a class="btn btn-secondary btn-sm btn-icon" href="${link}" target="_blank" title="Buka Undangan">🔗</a>
          </div>
        </td>
        <td style="color:var(--text-muted); font-size:0.8rem;">📅 ${dateStr}</td>
        <td>
          <div class="action-btns">
            <button class="btn btn-secondary btn-sm btn-icon" onclick="editGuest('${g.id}')" title="Edit">✏️</button>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteGuest('${g.id}', '${escapeHtml(g.name)}')" title="Hapus">🗑️</button>
          </div>
        </td>
      </tr>
    `;
    }).join('');
}

function filterGuests() {
    const search = document.getElementById('guest-search').value.toLowerCase();
    const rsvpFilter = document.getElementById('guest-filter-rsvp').value;

    let filtered = allGuests.filter(g => {
        const matchSearch = g.name.toLowerCase().includes(search) || (g.phone || '').includes(search);
        const matchRsvp = !rsvpFilter || g.rsvp === rsvpFilter;
        return matchSearch && matchRsvp;
    });

    renderGuests(filtered);
}

// ── Add / Edit Guest Modal ──
function openAddGuestModal() {
    document.getElementById('modal-guest-title').textContent = '➕ Tambah Tamu';
    document.getElementById('guest-edit-id').value = '';
    document.getElementById('guest-name-input').value = '';
    document.getElementById('guest-phone-input').value = '';
    document.getElementById('guest-rsvp-input').value = 'pending';
    document.getElementById('guest-submit-btn').textContent = '➕ Tambah';
    document.getElementById('link-preview-section').style.display = 'none';
    openModal('modal-add-guest');
}

function editGuest(id) {
    const guest = WeddingDB.getGuests().find(g => g.id === id);
    if (!guest) return;

    document.getElementById('modal-guest-title').textContent = '✏️ Edit Tamu';
    document.getElementById('guest-edit-id').value = id;
    document.getElementById('guest-name-input').value = guest.name;
    document.getElementById('guest-phone-input').value = guest.phone || '';
    document.getElementById('guest-rsvp-input').value = guest.rsvp;
    document.getElementById('guest-submit-btn').textContent = '💾 Simpan';

    // Show link
    const s = WeddingDB.getSettings();
    const link = `${s.baseUrl}?to=${encodeURIComponent(guest.name)}`;
    document.getElementById('guest-link-preview').value = link;
    document.getElementById('link-preview-section').style.display = 'block';

    openModal('modal-add-guest');
}

function submitGuestForm(event) {
    event.preventDefault();
    const name = document.getElementById('guest-name-input').value.trim();
    const phone = document.getElementById('guest-phone-input').value.trim();
    const rsvp = document.getElementById('guest-rsvp-input').value;
    const editId = document.getElementById('guest-edit-id').value;

    if (!name) {
        showAdminToast('Nama tamu harus diisi!', '⚠️');
        return;
    }

    if (editId) {
        // Update
        WeddingDB.updateGuest(editId, { name, phone, rsvp });
        showAdminToast(`Tamu "${name}" berhasil diperbarui`, '✅');
    } else {
        // Add
        const newGuest = WeddingDB.addGuest({ name, phone });
        WeddingDB.updateGuest(newGuest.id, { rsvp });
        showAdminToast(`Tamu "${name}" berhasil ditambahkan`, '✅');
    }

    closeModal('modal-add-guest');
    loadGuests();

    // Update dashboard badge
    const stats = WeddingDB.getGuestStats();
    setText('nav-badge-guests', stats.total);
}

function deleteGuest(id, name) {
    if (!confirm(`Hapus tamu "${name}"? Aksi ini tidak bisa dibatalkan.`)) return;
    WeddingDB.deleteGuest(id);
    showAdminToast(`Tamu "${name}" telah dihapus`, '🗑️');
    loadGuests();
}

function copyLink(encodedLink) {
    const link = decodeURIComponent(encodedLink);
    navigator.clipboard.writeText(link).then(() => {
        showAdminToast('Link undangan tersalin ke clipboard!', '📋');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showAdminToast('Link tersalin!', '📋');
    });
}

function copyGuestLink() {
    const link = document.getElementById('guest-link-preview').value;
    navigator.clipboard.writeText(link).then(() => {
        showAdminToast('Link tersalin!', '📋');
    });
}

function exportCSV() {
    WeddingDB.exportToCSV();
    showAdminToast('File CSV berhasil diunduh!', '📥');
}

// ════════════════════════════════════════
// WISHES ADMIN
// ════════════════════════════════════════
function loadWishesAdmin() {
    const wishes = WeddingDB.getWishes();
    const listEl = document.getElementById('wishes-admin-list');
    if (!listEl) return;

    updateNavBadges();

    if (wishes.length === 0) {
        listEl.innerHTML = `
          <div style="text-align:center; padding:4rem; color:var(--text-muted);">
            <div style="font-size:3rem; margin-bottom:1rem;">💌</div>
            <p style="margin-bottom:1.25rem;">Belum ada ucapan yang masuk.</p>
            <button class="btn btn-primary" onclick="openAddWishModal()">➕ Tambah Ucapan Pertama</button>
          </div>`;
        return;
    }

    listEl.innerHTML = wishes.map(w => `
      <div class="admin-wish-card">
        <div class="admin-wish-header">
          <span class="admin-wish-name">🌸 ${escapeHtml(w.name)}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge ${w.rsvp === 'hadir' ? 'badge-hadir' : w.rsvp === 'tidak' ? 'badge-tidak' : 'badge-pending'}">
              ${w.rsvp === 'hadir' ? '✅ Hadir' : w.rsvp === 'tidak' ? '❌ Tidak Hadir' : '⏳ Pending'}
            </span>
            <button class="btn btn-danger btn-sm btn-icon" onclick="deleteWish('${w.id}')" title="Hapus">🗑️</button>
          </div>
        </div>
        <p class="admin-wish-text">"${escapeHtml(w.wish)}"</p>
        <p class="admin-wish-time">🕐 ${timeAgo(w.createdAt)}</p>
      </div>
    `).join('');
}

function openAddWishModal() {
    // Reset form
    const form = document.getElementById('wish-admin-form');
    if (form) form.reset();
    openModal('modal-add-wish');
}

function submitAdminWish(event) {
    event.preventDefault();

    const name = document.getElementById('wish-admin-name').value.trim();
    const rsvp = document.getElementById('wish-admin-rsvp').value;
    const wish = document.getElementById('wish-admin-text').value.trim();

    if (!name || !wish) {
        showAdminToast('Nama dan ucapan harus diisi!', '⚠️');
        return;
    }

    // Simpan ucapan baru ke database
    WeddingDB.addWish({ name, wish, rsvp });

    // Jika nama cocok dengan tamu terdaftar, update RSVP-nya
    WeddingDB.updateGuestRsvpByName(name, rsvp);

    closeModal('modal-add-wish');
    loadWishesAdmin();
    loadGuests();   // refresh tabel tamu jika RSVP berubah
    updateNavBadges();

    showAdminToast(`Ucapan dari "${name}" berhasil ditambahkan dan akan muncul di halaman undangan! 🌸`, '✅');
}

function deleteWish(id) {
    if (!confirm('Hapus ucapan ini?')) return;
    WeddingDB.deleteWish(id);
    loadWishesAdmin();
    showAdminToast('Ucapan dihapus', '🗑️');
}

// ════════════════════════════════════════
// SETTINGS
// ════════════════════════════════════════
function loadSettings() {
    const s = WeddingDB.getSettings();
    const settingKeys = [
        'groomName', 'groomFormal', 'groomFather', 'groomMother', 'groomPhoto',
        'brideName', 'brideFormal', 'brideFather', 'brideMother', 'bridePhoto',
        'akadDate', 'akadTime', 'akadVenue', 'akadAddress', 'akadMapsUrl',
        'receptionDate', 'receptionTime', 'receptionVenue', 'receptionAddress', 'receptionMapsUrl',
        'quoteText', 'quoteSource',
        'bankName1', 'bankAccount1', 'bankHolder1',
        'bankName2', 'bankAccount2', 'bankHolder2',
        'baseUrl', 'musicUrl',
    ];

    settingKeys.forEach(key => {
        const el = document.getElementById(`set-${key}`);
        if (el) el.value = s[key] || '';
    });
}

function saveSettings(event) {
    event.preventDefault();
    const currentSettings = WeddingDB.getSettings();
    const form = document.getElementById('settings-form');
    const formData = new FormData(form);
    const newSettings = { ...currentSettings };

    const settingKeys = [
        'groomName', 'groomFormal', 'groomFather', 'groomMother', 'groomPhoto',
        'brideName', 'brideFormal', 'brideFather', 'brideMother', 'bridePhoto',
        'akadDate', 'akadTime', 'akadVenue', 'akadAddress', 'akadMapsUrl',
        'receptionDate', 'receptionTime', 'receptionVenue', 'receptionAddress', 'receptionMapsUrl',
        'quoteText', 'quoteSource',
        'bankName1', 'bankAccount1', 'bankHolder1',
        'bankName2', 'bankAccount2', 'bankHolder2',
        'baseUrl', 'musicUrl',
    ];

    settingKeys.forEach(key => {
        const el = document.getElementById(`set-${key}`);
        if (el) newSettings[key] = el.value.trim();
    });

    WeddingDB.saveSettings(newSettings);

    // Handle credential changes
    const newUsername = document.getElementById('set-newUsername').value.trim();
    const newPassword = document.getElementById('set-newPassword').value;
    if (newUsername || newPassword) {
        const currentAdmin = WeddingDB.getAdmin();
        WeddingDB.updateAdminCredentials(
            newUsername || currentAdmin.username,
            newPassword || currentAdmin.password
        );
        document.getElementById('set-newUsername').value = '';
        document.getElementById('set-newPassword').value = '';
        if (newUsername) {
            sessionStorage.setItem('wedding_admin_user', newUsername);
            setText('admin-username', newUsername);
            const av = document.getElementById('admin-avatar');
            if (av) av.textContent = newUsername.charAt(0).toUpperCase();
        }
    }

    showAdminToast('Pengaturan berhasil disimpan! ✨ Refresh halaman undangan untuk melihat perubahan.', '💾');
}

// ════════════════════════════════════════
// MODAL HELPERS
// ════════════════════════════════════════
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('show');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('show');
}

// Close on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('show');
    });
});

// ════════════════════════════════════════
// TOAST
// ════════════════════════════════════════
function showAdminToast(message, icon = '✅') {
    const toast = document.getElementById('admin-toast');
    if (!toast) return;
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ════════════════════════════════════════
// AUTH
// ════════════════════════════════════════
function doLogout() {
    if (confirm('Keluar dari dashboard admin?')) {
        sessionStorage.removeItem('wedding_admin_logged_in');
        sessionStorage.removeItem('wedding_admin_user');
        window.location.href = 'login.html';
    }
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setStyle(id, prop, val) {
    const el = document.getElementById(id);
    if (el) el.style[prop] = val;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

function timeAgo(isoString) {
    const now = new Date();
    const past = new Date(isoString);
    const diff = Math.floor((now - past) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ════════════════════════════════════════
// NAV BADGE HELPER
// ════════════════════════════════════════
function updateNavBadges() {
    const stats = WeddingDB.getGuestStats();
    const wCount = WeddingDB.getWishesCount();
    setText('nav-badge-guests', stats.total);
    setText('nav-badge-wishes', wCount);
}

// ════════════════════════════════════════
// INIT
// ════════════════════════════════════════
loadDashboard();
updateNavBadges();
