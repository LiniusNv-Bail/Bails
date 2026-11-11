// ==========================================
// ULTIMATE BAN SENTINEL | NO FILE | AUTO-KENON
// ==========================================

let memoryGuard = { isBanned: false, cooldownUntil: 0, reason: null, lastTrigger: null };

const CONFIG = {
    MAX_MSG_PER_SEC: 3,            // Maksimal 3 pesan per detik (Sangat ketat)
    MAX_PAYLOAD_SIZE_MB: 5,        // Jika payload > 5MB, langsung kenon (anti-OOM)
    FAIL_WINDOW_MS: 10000,         // Toleransi error: 10 detik
    MAX_FAILS_IN_WINDOW: 2,        // 2x error dalam 10 detik = KENON
    BAN_KEYWORDS: [
        'restricted', 'banned', 'forbidden', 'too many requests',
        'rate limit', 'ratelimit', 'spam', 'account blocked',
        'account has been', 'temporarily blocked', 'not-authorized',
        'not authorized', 'invalid session', 'logged out', 'conflict', 'protocol error'
    ],
    BAN_CLOSE_CODES: [401, 403, 409, 440],
    BAN_ACK_CODES: [401, 403, 479],
    WA_OFFICIAL_JIDS: ['0@s.whatsapp.net', '16505361212@s.whatsapp.net']
};

const sentinels = new WeakMap();

export function isOnCooldown() { 
    return memoryGuard.isBanned || (Date.now() < memoryGuard.cooldownUntil); 
}

export class BanSentinel {
    constructor(sock, logger) {
        this.sock = sock;
        this.logger = logger || console;
        this.triggered = false;
        this.msgTimestamps = [];
        this.failTimestamps = [];
        this.init();
    }

    init() {
        this.logger.info(`🛡️ [BAN_SENTINEL] Sistem Keamanan Ultimate Aktif.`);

        // --- 1. BAJAK FUNGSI PENGIRIMAN (MONKEY PATCHING) ---
        const originalRelay = this.sock.relayMessage;
        const originalSend = this.sock.sendMessage;
        const self = this;

        this.sock.relayMessage = async function(jid, message, options) {
            if (self.triggered) return;
            self.inspectPayload(message);     // Cek ukuran payload
            self.checkRateLimit();            // Cek spam
            try {
                return await originalRelay.apply(this, arguments);
            } catch (err) {
                self.checkError(err);
                throw err;
            }
        };

        if (originalSend) {
            this.sock.sendMessage = async function(jid, content, options) {
                if (self.triggered) return;
                self.checkRateLimit();
                try {
                    return await originalSend.apply(this, arguments);
                } catch (err) {
                    self.checkError(err);
                    throw err;
                }
            };
        }

        // --- 2. SADAP EVENT KONEKSI ---
        this.sock.ev.on('connection.update', (update) => {
            if (self.triggered) return;
            if (update.connection === 'close') {
                const code = update.lastDisconnect?.error?.output?.statusCode || 
                             update.lastDisconnect?.error?.data?.statusCode;
                if (CONFIG.BAN_CLOSE_CODES.includes(code)) {
                    self.trigger(`Koneksi ditutup paksa oleh server (Code: ${code})`);
                }
            }
        });

        // --- 3. SADAP EVENT PESAN MASUK (PERINGATAN WA) ---
        this.sock.ev.on('messages.upsert', (m) => {
            if (self.triggered) return;
            const msg = m.messages[0];
            if (!msg || !msg.key || msg.key.fromMe) return;

            if (CONFIG.WA_OFFICIAL_JIDS.includes(msg.key.remoteJid)) {
                const text = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").toLowerCase();
                if (text.includes('banned') || text.includes('violation') || text.includes('spam') || text.includes('restricted')) {
                    self.trigger(`Peringatan Resmi WhatsApp Terdeteksi!`);
                }
            }
        });

        // --- 4. SADAP EVENT UPDATE PESAN (ACK ERROR / DITOLAK) ---
        this.sock.ev.on('messages.update', (updates) => {
            if (self.triggered) return;
            for (const u of updates) {
                if (u.update && (u.update.status === 0 || u.update.status === 'ERROR')) {
                    const errCode = u.update.messageStubParameters?.[0] || 0;
                    if (CONFIG.BAN_ACK_CODES.includes(Number(errCode))) {
                        self.trigger(`Pesan Ditolak Server (Ack Error: ${errCode})`);
                    }
                }
            }
        });
    }

    // --- CEK SPAM (RATE LIMIT) ---
    checkRateLimit() {
        if (this.triggered) return;
        const now = Date.now();
        this.msgTimestamps.push(now);
        this.msgTimestamps = this.msgTimestamps.filter(t => now - t <= 1000);

        if (this.msgTimestamps.length > CONFIG.MAX_MSG_PER_SEC) {
            this.trigger(`Spam Terdeteksi (Mengirim > ${CONFIG.MAX_MSG_PER_SEC} pesan/detik)`);
        }
    }

    // --- CEK UKURAN PAYLOAD (ANTI-OOM / ANTI KENON MESIN) ---
    inspectPayload(message) {
        if (this.triggered) return;
        try {
            const payloadString = JSON.stringify(message);
            const sizeInMB = (payloadString.length / (1024 * 1024));
            
            // Cek jika payload terlalu besar (misal karena nested message / unicode berlebihan)
            if (sizeInMB > CONFIG.MAX_PAYLOAD_SIZE_MB) {
                this.trigger(`Payload Terlalu Besar (${sizeInMB.toFixed(2)} MB) - Berpotensi membuat RAM Crash!`);
            }
            
            // Cek jika terlalu banyak karakter unicode berbahaya (\u202E dll)
            const badChars = (payloadString.match(/\\u202E/g) || []).length;
            if (badChars > 50) {
                this.trigger(`Terdeteksi ${badChars} karakter Unicode RTL (Sangat Berbahaya)`);
            }
        } catch (e) {}
    }

    // --- CEK ERROR SECARA UMUM ---
    checkError(err) {
        if (this.triggered) return;
        if (!err) return;

        const msg = (err.message || String(err) || '').toLowerCase();
        
        const kw = CONFIG.BAN_KEYWORDS.find(k => msg.includes(k));
        if (kw) {
            this.trigger(`Kata Kunci Bahaya: "${kw}"`);
            return;
        }

        const now = Date.now();
        this.failTimestamps.push(now);
        this.failTimestamps = this.failTimestamps.filter(t => now - t <= CONFIG.FAIL_WINDOW_MS);
        
        if (this.failTimestamps.length >= CONFIG.MAX_FAILS_IN_WINDOW) {
            this.trigger(`Kegagalan Beruntun (${this.failTimestamps.length}x Error dalam ${CONFIG.FAIL_WINDOW_MS/1000}s)`);
        }
    }

    // --- EKSEKUSI KENON (FORCE CLOSE) ---
    trigger(reason) {
        if (this.triggered) return;
        this.triggered = true;
        memoryGuard.isBanned = true;
        memoryGuard.reason = reason;
        memoryGuard.lastTrigger = new Date().toISOString();

        this.logger.error(`\n🚨🚨 [BAN_SENTINEL] SISTEM KENON DIPICU! 🚨🚨`);
        this.logger.error(`🚨 Alasan: ${reason}`);
        this.logger.error(`🚨 Menutup paksa seluruh koneksi untuk menyelamatkan nomor...\n`);

        try {
            if (this.sock?.end) this.sock.end(new Error('BAN_SENTINEL_TRIGGERED'));
            if (this.sock?.ws?.close) this.sock.ws.close();
            
            // Hancurkan Node.js (Force Close) setelah 1 detik
            setTimeout(() => {
                process.exit(1); 
            }, 1000);

        } catch (e) {
            process.exit(1);
        }
    }
}

export function getSentinel(sock, logger) {
    if (!sentinels.has(sock)) {
        sentinels.set(sock, new BanSentinel(sock, logger));
    }
    return sentinels.get(sock);
}

export { CONFIG };