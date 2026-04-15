/**
 * Wedding Invitation - Database (localStorage)
 * Central data management for the entire app
 */

const WeddingDB = {
    // ── Keys ──
    KEYS: {
        SETTINGS: 'wedding_settings',
        GUESTS: 'wedding_guests',
        WISHES: 'wedding_wishes',
        ADMIN: 'wedding_admin',
    },

    // ── Default Settings ──
    defaultSettings: {
        groomName: 'Rizky Pratama',
        groomFormal: 'Rizky Pratama, S.T.',
        groomFather: 'Bapak Ahmad Pratama',
        groomMother: 'Ibu Sari Pratama',
        groomPhoto: '',
        brideName: 'Annisa Rahayu',
        brideFormal: 'Annisa Rahayu, S.Pd.',
        brideFather: 'Bapak Hendra Rahayu',
        brideMother: 'Ibu Dewi Rahayu',
        bridePhoto: '',
        akadDate: '2025-10-11',
        akadTime: '08:00',
        akadVenue: 'Masjid Al-Ikhlas',
        akadAddress: 'Jl. Mawar No. 12, Jakarta Selatan',
        akadMapsUrl: 'https://maps.google.com',
        receptionDate: '2025-10-11',
        receptionTime: '11:00',
        receptionVenue: 'Gedung Serbaguna Bahagia',
        receptionAddress: 'Jl. Melati No. 45, Jakarta Selatan',
        receptionMapsUrl: 'https://maps.google.com',
        quoteText: 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu istri-istri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya.',
        quoteSource: 'QS. Ar-Rum: 21',
        bankName1: 'Bank BCA',
        bankAccount1: '1234567890',
        bankHolder1: 'Rizky Pratama',
        bankName2: 'Bank Mandiri',
        bankAccount2: '0987654321',
        bankHolder2: 'Annisa Rahayu',
        story1Date: 'Maret 2019',
        story1Title: 'Pertama Bertemu',
        story1Desc: 'Kami pertama kali bertemu di acara seminar kampus yang ternyata mengubah segalanya.',
        story2Date: 'Juni 2020',
        story2Title: 'Semakin Dekat',
        story2Desc: 'Seiring waktu berlalu, persahabatan kami berkembang menjadi sesuatu yang lebih dalam.',
        story3Date: 'Desember 2022',
        story3Title: 'Lamaran',
        story3Desc: 'Dengan penuh keberanian dan doa, Rizky melamar Annisa di hadapan keluarga.',
        story4Date: 'Oktober 2025',
        story4Title: 'Hari Bahagia',
        story4Desc: 'Hari yang paling dinantikan akhirnya tiba. Semoga Allah meridhoi perjalanan kami.',
        baseUrl: '',
        musicUrl: 'https://www.bensound.com/bensound-music/bensound-romantic.mp3',
    },

    // ── Default Admin ──
    defaultAdmin: { username: 'admin', password: 'wedding2025' },

    // ── Init ──
    init() {
        if (!localStorage.getItem(this.KEYS.SETTINGS)) {
            this.saveSettings(this.defaultSettings);
        }
        if (!localStorage.getItem(this.KEYS.GUESTS)) {
            const demo = [
                { id: this.genId(), name: 'Budi Santoso', phone: '081234567890', rsvp: 'hadir', createdAt: new Date().toISOString() },
                { id: this.genId(), name: 'Rina Kusuma', phone: '082345678901', rsvp: 'pending', createdAt: new Date().toISOString() },
                { id: this.genId(), name: 'Dian Pratiwi', phone: '083456789012', rsvp: 'tidak', createdAt: new Date().toISOString() },
            ];
            localStorage.setItem(this.KEYS.GUESTS, JSON.stringify(demo));
        }
        if (!localStorage.getItem(this.KEYS.WISHES)) {
            const demo = [
                { id: this.genId(), name: 'Budi Santoso', wish: 'Semoga menjadi keluarga yang sakinah, mawaddah, warahmah. Barakallah! 🌸', rsvp: 'hadir', createdAt: new Date(Date.now() - 3600000).toISOString() },
                { id: this.genId(), name: 'Rina Kusuma', wish: 'Selamat menempuh hidup baru! Semoga selalu dalam kebahagiaan dan keberkahan Allah SWT. 💒', rsvp: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString() },
            ];
            localStorage.setItem(this.KEYS.WISHES, JSON.stringify(demo));
        }
        if (!localStorage.getItem(this.KEYS.ADMIN)) {
            localStorage.setItem(this.KEYS.ADMIN, JSON.stringify(this.defaultAdmin));
        }
    },

    // ── Settings ──
    getSettings() {
        const saved = localStorage.getItem(this.KEYS.SETTINGS);
        const merged = saved ? { ...this.defaultSettings, ...JSON.parse(saved) } : { ...this.defaultSettings };
        // Always resolve baseUrl at runtime if not manually set
        if (!merged.baseUrl) {
            merged.baseUrl = window.location.origin + '/index.html';
        }
        return merged;
    },

    saveSettings(data) {
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(data));
    },

    // ── Guests ──
    getGuests() {
        const saved = localStorage.getItem(this.KEYS.GUESTS);
        return saved ? JSON.parse(saved) : [];
    },

    saveGuests(guests) {
        localStorage.setItem(this.KEYS.GUESTS, JSON.stringify(guests));
    },

    addGuest(guest) {
        const guests = this.getGuests();
        const newGuest = { ...guest, id: this.genId(), rsvp: 'pending', createdAt: new Date().toISOString() };
        guests.push(newGuest);
        this.saveGuests(guests);
        return newGuest;
    },

    updateGuest(id, data) {
        const guests = this.getGuests();
        const idx = guests.findIndex(g => g.id === id);
        if (idx !== -1) {
            guests[idx] = { ...guests[idx], ...data };
            this.saveGuests(guests);
            return guests[idx];
        }
        return null;
    },

    deleteGuest(id) {
        const guests = this.getGuests().filter(g => g.id !== id);
        this.saveGuests(guests);
    },

    // ── Wishes ──
    getWishes() {
        const saved = localStorage.getItem(this.KEYS.WISHES);
        return saved ? JSON.parse(saved) : [];
    },

    addWish(wish) {
        const wishes = this.getWishes();
        const newWish = { ...wish, id: this.genId(), createdAt: new Date().toISOString() };
        wishes.unshift(newWish);
        localStorage.setItem(this.KEYS.WISHES, JSON.stringify(wishes));
        return newWish;
    },

    deleteWish(id) {
        const wishes = this.getWishes().filter(w => w.id !== id);
        localStorage.setItem(this.KEYS.WISHES, JSON.stringify(wishes));
    },

    getWishesCount() {
        return this.getWishes().length;
    },

    // ── Auth ──
    getAdmin() {
        const saved = localStorage.getItem(this.KEYS.ADMIN);
        return saved ? JSON.parse(saved) : this.defaultAdmin;
    },

    verifyAdmin(username, password) {
        const admin = this.getAdmin();
        return admin.username === username && admin.password === password;
    },

    updateAdminCredentials(username, password) {
        localStorage.setItem(this.KEYS.ADMIN, JSON.stringify({ username, password }));
    },

    // ── Helpers ──
    genId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    getGuestStats() {
        const guests = this.getGuests();
        return {
            total: guests.length,
            hadir: guests.filter(g => g.rsvp === 'hadir').length,
            tidak: guests.filter(g => g.rsvp === 'tidak').length,
            pending: guests.filter(g => g.rsvp === 'pending').length,
        };
    },

    exportToCSV() {
        const guests = this.getGuests();
        const settings = this.getSettings();
        const header = ['No', 'Nama Tamu', 'No. HP', 'Status RSVP', 'Link Undangan', 'Tanggal Ditambahkan'];
        const rows = guests.map((g, i) => [
            i + 1,
            g.name,
            g.phone || '-',
            g.rsvp === 'hadir' ? 'Hadir' : g.rsvp === 'tidak' ? 'Tidak Hadir' : 'Belum Konfirmasi',
            `${settings.baseUrl}?to=${encodeURIComponent(g.name)}`,
            new Date(g.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }),
        ]);

        const csvContent = [header, ...rows]
            .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daftar-tamu-${settings.groomName.split(' ')[0]}-${settings.brideName.split(' ')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    },

    // Update RSVP when guest submits wish
    updateGuestRsvpByName(name, rsvp) {
        const guests = this.getGuests();
        const match = guests.find(g => g.name.toLowerCase().trim() === name.toLowerCase().trim());
        if (match) {
            this.updateGuest(match.id, { rsvp });
        }
    },
};

// Initialize on load
WeddingDB.init();
