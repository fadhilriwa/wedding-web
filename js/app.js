/**
 * Wedding Invitation - Web User JavaScript
 * Handles: URL params, countdown, wishes, music, animations
 */

// ── Global State ──
let isMusicPlaying = false;
let countdownInterval = null;

// ── Init on DOM Ready ──
document.addEventListener('DOMContentLoaded', () => {
    populateFromSettings();
    setupGuestFromURL();
    setupMusicFromSettings();

    // ── LIVE SYNC: Jika admin update ucapan di tab lain, tampil otomatis ──
    window.addEventListener('storage', (e) => {
        if (e.key === WeddingDB.KEYS.WISHES) {
            renderWishes();
        }
    });
});

// ════════════════════════════════════════
// POPULATE CONTENT FROM SETTINGS
// ════════════════════════════════════════
function populateFromSettings() {
    const s = WeddingDB.getSettings();

    // Hero
    setText('hero-groom-name', s.groomName.split(' ')[0]);
    setText('hero-bride-name', s.brideName.split(' ')[0]);
    setText('hero-event-date', formatDateLong(s.receptionDate));
    setText('page-quote', `"${s.quoteText}"`);
    setText('page-quote-source', `— ${s.quoteSource}`);

    // Couple
    setText('groom-name-display', s.groomName.split(' ')[0]);
    setText('groom-formal-display', s.groomFormal);
    setText('groom-father-display', s.groomFather);
    setText('groom-mother-display', s.groomMother);
    setText('bride-name-display', s.brideName.split(' ')[0]);
    setText('bride-formal-display', s.brideFormal);
    setText('bride-father-display', s.brideFather);
    setText('bride-mother-display', s.brideMother);

    // Photos
    if (s.groomPhoto) {
        document.getElementById('groom-photo-wrap').innerHTML =
            `<img src="${s.groomPhoto}" alt="${s.groomName}" class="couple-photo" />`;
    }
    if (s.bridePhoto) {
        document.getElementById('bride-photo-wrap').innerHTML =
            `<img src="${s.bridePhoto}" alt="${s.brideName}" class="couple-photo" />`;
    }

    // Events
    setText('akad-venue-display', s.akadVenue);
    setText('akad-date-display', formatDateLong(s.akadDate));
    setText('akad-time-display', s.akadTime);
    setText('akad-address-display', s.akadAddress);
    setAttr('akad-maps-btn', 'href', s.akadMapsUrl);

    setText('reception-venue-display', s.receptionVenue);
    setText('reception-date-display', formatDateLong(s.receptionDate));
    setText('reception-time-display', s.receptionTime);
    setText('reception-address-display', s.receptionAddress);
    setAttr('reception-maps-btn', 'href', s.receptionMapsUrl);

    // Countdown target = reception datetime
    startCountdown(s.receptionDate, s.receptionTime, s.receptionVenue);

    // Story
    buildStoryTimeline(s);

    // Gift
    setText('bank1-name', s.bankName1);
    setText('bank1-account', s.bankAccount1);
    setText('bank1-holder', `a.n. ${s.bankHolder1}`);
    setText('bank2-name', s.bankName2);
    setText('bank2-account', s.bankAccount2);
    setText('bank2-holder', `a.n. ${s.bankHolder2}`);

    // Footer
    setText('footer-names', `${s.groomName.split(' ')[0]} & ${s.brideName.split(' ')[0]}`);
    setText('footer-date', `— ${formatDateLong(s.receptionDate)} —`);

    // Wishes — always render fresh from localStorage
    renderWishes();
}

// ════════════════════════════════════════
// SETUP GUEST FROM URL PARAMETER
// ════════════════════════════════════════
function setupGuestFromURL() {
    const params = new URLSearchParams(window.location.search);
    const guestName = params.get('to');

    const overlayGuest = document.getElementById('overlay-guest-name');
    const heroGuestWrapper = document.getElementById('hero-guest-wrapper');
    const heroGuestName = document.getElementById('hero-guest-name');
    const wishNameInput = document.getElementById('wish-name');

    if (guestName && guestName.trim()) {
        const name = decodeURIComponent(guestName.trim());
        overlayGuest.textContent = `Bapak/Ibu/Sdr. ${name}`;
        heroGuestWrapper.style.display = 'inline-block';
        heroGuestName.textContent = `Bapak/Ibu/Sdr. ${name}`;
        if (wishNameInput) wishNameInput.value = name;
        document.title = `Undangan Pernikahan untuk ${name}`;
    }
}

// ════════════════════════════════════════
// SETUP MUSIC FROM SETTINGS
// ════════════════════════════════════════

// URL yang merupakan HALAMAN WEB, bukan file audio
const INVALID_MUSIC_PATTERNS = [
    /bensound\.com\/royalty-free-music/i,
    /bensound\.com\/music\//i,
    /bensound\.com\/track\//i,
    /youtube\.com/i,
    /youtu\.be/i,
    /spotify\.com/i,
    /soundcloud\.com/i,
    /pixabay\.com\/music\/search/i,
    /pixabay\.com\/music\/?$/i,
];

// URL fallback default jika URL dari settings tidak valid
const DEFAULT_MUSIC_URL = 'https://www.bensound.com/bensound-music/bensound-romantic.mp3';

function setupMusicFromSettings() {
    const s = WeddingDB.getSettings();
    const music = document.getElementById('bg-music');
    if (!music) return;

    let musicUrl = (s.musicUrl || '').trim();

    // Validasi: cek apakah URL adalah halaman web bukan file audio
    if (musicUrl) {
        const isInvalidUrl = INVALID_MUSIC_PATTERNS.some(p => p.test(musicUrl));
        const isDirectFile = /\.(mp3|ogg|wav|aac|webm|m4a)(\?.*)?$/i.test(musicUrl);

        if (isInvalidUrl || (!isDirectFile && musicUrl.startsWith('http'))) {
            // Tampilkan warning setelah undangan dibuka
            setTimeout(() => {
                showToast(
                    'URL musik tidak valid. Gunakan link .mp3 langsung, bukan halaman web.',
                    '⚠️'
                );
            }, 2000);
            musicUrl = DEFAULT_MUSIC_URL; // fallback ke default
        }
    }

    // Tetapkan src (pakai default jika kosong)
    music.src = musicUrl || DEFAULT_MUSIC_URL;
    music.load();

    // Handler jika file gagal dimuat (404, CORS, dll)
    music.onerror = function () {
        if (music.src !== DEFAULT_MUSIC_URL) {
            console.warn('Musik gagal dimuat, beralih ke default.');
            music.src = DEFAULT_MUSIC_URL;
            music.load();
            setTimeout(() => {
                showToast('Musik tidak dapat dimuat. Menggunakan musik default.', '🎵');
            }, 500);
        }
    };
}

// ════════════════════════════════════════
// OPEN INVITATION (Envelope Animation)
// ════════════════════════════════════════
function openInvitation() {
    const overlay = document.getElementById('envelope-overlay');
    const main = document.getElementById('main-content');

    overlay.classList.add('hidden');
    main.classList.add('visible');

    // Re-render wishes saat undangan dibuka (pastikan data terbaru)
    renderWishes();

    // Start observer for reveal animations
    setTimeout(() => {
        setupRevealObserver();
        // Auto-play music (might be blocked by browser - graceful fail)
        tryAutoPlayMusic();
    }, 800);
}

// ════════════════════════════════════════
// REVEAL ON SCROLL ANIMATION
// ════════════════════════════════════════
function setupRevealObserver() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    reveals.forEach(el => observer.observe(el));
}

// ════════════════════════════════════════
// COUNTDOWN TIMER
// ════════════════════════════════════════
function startCountdown(dateStr, timeStr, eventName) {
    const target = new Date(`${dateStr}T${timeStr}:00`);

    function tick() {
        const now = new Date();
        const diff = target - now;

        if (diff <= 0) {
            setText('cd-days', '00');
            setText('cd-hours', '00');
            setText('cd-minutes', '00');
            setText('cd-seconds', '00');
            setText('countdown-event-name', `🎉 Hari pernikahan ${eventName} telah tiba!`);
            if (countdownInterval) clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        animateNumber('cd-days', String(days).padStart(2, '0'));
        animateNumber('cd-hours', String(hours).padStart(2, '0'));
        animateNumber('cd-minutes', String(minutes).padStart(2, '0'));
        animateNumber('cd-seconds', String(seconds).padStart(2, '0'));

        setText('countdown-event-name',
            `Menuju: ${eventName} · ${formatDateLong(dateStr)} pukul ${timeStr} WIB`);
    }

    tick();
    countdownInterval = setInterval(tick, 1000);
}

function animateNumber(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.textContent !== value) {
        el.style.transform = 'scale(1.2)';
        el.style.opacity = '0.5';
        setTimeout(() => {
            el.textContent = value;
            el.style.transform = '';
            el.style.opacity = '';
        }, 100);
    }
}

// ════════════════════════════════════════
// STORY TIMELINE
// ════════════════════════════════════════
function buildStoryTimeline(s) {
    const icons = ['🌱', '💕', '💍', '🎊'];
    const stories = [
        { date: s.story1Date, title: s.story1Title, desc: s.story1Desc },
        { date: s.story2Date, title: s.story2Title, desc: s.story2Desc },
        { date: s.story3Date, title: s.story3Title, desc: s.story3Desc },
        { date: s.story4Date, title: s.story4Title, desc: s.story4Desc },
    ];

    const timeline = document.getElementById('story-timeline');
    if (!timeline) return;

    timeline.innerHTML = stories.map((story, i) => `
    <div class="timeline-item">
      <div class="timeline-dot">${icons[i]}</div>
      <div class="timeline-content">
        <p class="timeline-date">${story.date}</p>
        <h4 class="timeline-title">${story.title}</h4>
        <p class="timeline-desc">${story.desc}</p>
      </div>
    </div>
  `).join('');
}

// ════════════════════════════════════════
// WISHES
// ════════════════════════════════════════
function submitWish(event) {
    event.preventDefault();

    const name = document.getElementById('wish-name').value.trim();
    const text = document.getElementById('wish-text').value.trim();
    const rsvpInput = document.querySelector('input[name="rsvp"]:checked');

    if (!name || !text || !rsvpInput) {
        showToast('Harap lengkapi semua kolom ya! 😊', '⚠️');
        return;
    }

    const btn = document.getElementById('wish-submit-btn');
    btn.disabled = true;
    btn.textContent = '⏳ Mengirim...';

    setTimeout(() => {
        const rsvp = rsvpInput.value;

        // Simpan ucapan ke localStorage
        WeddingDB.addWish({ name, wish: text, rsvp });

        // Update status RSVP tamu jika nama cocok
        WeddingDB.updateGuestRsvpByName(name, rsvp);

        // Reset form
        document.getElementById('wish-form').reset();
        btn.disabled = false;
        btn.textContent = '💌 Kirim Ucapan';

        // Re-render daftar ucapan
        renderWishes();
        showToast('Ucapan terkirim! Terima kasih 💛', '✅');

        // Scroll ke daftar ucapan
        document.getElementById('wishes-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
}

function renderWishes() {
    const list = document.getElementById('wishes-list');
    if (!list) return;

    // Selalu baca SEGAR dari localStorage
    const wishes = WeddingDB.getWishes();

    if (wishes.length === 0) {
        list.innerHTML = `
          <div style="text-align:center; color:var(--text-light); font-style:italic; padding:2rem;">
            Belum ada ucapan. Jadilah yang pertama! 💌
          </div>`;
        return;
    }

    list.innerHTML = wishes.map(w => `
    <div class="wish-card">
      <div class="wish-header">
        <span class="wish-name">🌸 ${escapeHtml(w.name)}</span>
        <span class="wish-rsvp ${w.rsvp === 'hadir' ? 'rsvp-hadir' : w.rsvp === 'tidak' ? 'rsvp-tidak' : 'rsvp-pending'}">
          ${w.rsvp === 'hadir' ? '✅ Hadir' : w.rsvp === 'tidak' ? '❌ Tidak Hadir' : '🤔 Mungkin'}
        </span>
      </div>
      <p class="wish-text">"${escapeHtml(w.wish)}"</p>
      <p class="wish-time">🕐 ${timeAgo(w.createdAt)}</p>
    </div>
  `).join('');
}

// ════════════════════════════════════════
// MUSIC PLAYER
// ════════════════════════════════════════
function tryAutoPlayMusic() {
    const music = document.getElementById('bg-music');
    if (!music) return;
    music.volume = 0.3;
    music.play().then(() => {
        isMusicPlaying = true;
        updateMusicBtn();
    }).catch(() => {
        // Browser blocked autoplay — tamu harus klik tombol musik
    });
}

function toggleMusic() {
    const music = document.getElementById('bg-music');
    if (!music) return;

    if (isMusicPlaying) {
        music.pause();
        isMusicPlaying = false;
    } else {
        music.volume = 0.3;
        music.play().then(() => {
            isMusicPlaying = true;
        }).catch(() => {
            showToast('Tidak dapat memutar musik', '🎵');
        });
    }
    updateMusicBtn();
}

function updateMusicBtn() {
    const btn = document.getElementById('music-btn');
    if (!btn) return;
    btn.textContent = isMusicPlaying ? '🎵' : '🔇';
    if (isMusicPlaying) {
        btn.classList.add('playing');
    } else {
        btn.classList.remove('playing');
    }
}

// ════════════════════════════════════════
// COPY TO CLIPBOARD
// ════════════════════════════════════════
function copyToClipboard(elementId, btn) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const text = el.textContent.replace(/\s/g, '');
    navigator.clipboard.writeText(text).then(() => {
        const original = btn.textContent;
        btn.textContent = '✅ Tersalin!';
        setTimeout(() => btn.textContent = original, 2000);
        showToast(`Nomor rekening tersalin: ${text}`, '📋');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('Tersalin ke clipboard!', '📋');
    });
}

// ════════════════════════════════════════
// TOAST NOTIFICATION
// ════════════════════════════════════════
function showToast(message, icon = '✅') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.innerHTML = `${icon} ${message}`;
    toast.style.display = 'block';
    toast.style.animation = 'none';
    void toast.offsetWidth; // reflow
    toast.style.animation = '';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function setAttr(id, attr, value) {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, value);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

function formatDateLong(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

function timeAgo(isoString) {
    const now = new Date();
    const past = new Date(isoString);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)} hari yang lalu`;
    return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
});
