import fs from 'fs';
import path from 'path';

const GUARD_FILE = path.join(process.cwd(), '.baileys-ban-guard.json');

const CONFIG = {
    FAIL_WINDOW_MS: 30000,
    MAX_FAILS_IN_WINDOW: 5,
    COOLDOWN_MINUTES: 60,
    BAN_KEYWORDS: [
        'restricted', 'banned', 'forbidden', 'too many requests',
        'rate limit', 'ratelimit', 'spam', 'account blocked',
        'account has been', 'temporarily blocked', 'not-authorized',
        'not authorized', 'invalid session'
    ],
    BAN_CLOSE_CODES: [401, 403, 440],
    STREAM_ERROR_CODES: [400, 401, 403, 409, 429, 440, 500, 503]
};

const sentinels = new WeakMap();

function loadGuard() {
    try {
        if (fs.existsSync(GUARD_FILE)) return JSON.parse(fs.readFileSync(GUARD_FILE, 'utf8'));
    } catch (e) {}
    return { cooldownUntil: 0, reason: null, lastTrigger: null };
}

function saveGuard(data) {
    try {
        fs.writeFileSync(GUARD_FILE, JSON.stringify(data, null, 2));
    } catch (e) {}
}

export function isOnCooldown() {
    return Date.now() < loadGuard().cooldownUntil;
}

export function getCooldownRemaining() {
    const guard = loadGuard();
    const ms = guard.cooldownUntil - Date.now();
    return ms > 0 ? Math.ceil(ms / 60000) : 0;
}

function matchesBanKeyword(err) {
    if (!err) return false;
    const msg = (err.message || String(err) || '').toLowerCase();
    return CONFIG.BAN_KEYWORDS.find(kw => msg.includes(kw)) || false;
}

function getStatusCode(err) {
    return err?.statusCode || err?.data?.statusCode || err?.output?.statusCode || null;
}

export class BanSentinel {
    constructor(sock, logger) {
        this.sock = sock;
        this.logger = logger || console;
        this.failLog = [];
        this.triggered = false;
    }

    check(err) {
        if (this.triggered) return true;
        const kw = matchesBanKeyword(err);
        if (kw) {
            this.trigger(`Ban keyword detected: "${kw}"`);
            return true;
        }
        const code = getStatusCode(err);
        if (code && CONFIG.BAN_CLOSE_CODES.includes(code)) {
            this.trigger(`Dangerous status code: ${code}`);
            return true;
        }
        const now = Date.now();
        this.failLog.push(now);
        this.failLog = this.failLog.filter(t => now - t <= CONFIG.FAIL_WINDOW_MS);
        if (this.failLog.length >= CONFIG.MAX_FAILS_IN_WINDOW) {
            this.trigger(`Too many failures (${this.failLog.length} in ${CONFIG.FAIL_WINDOW_MS / 1000}s)`);
            return true;
        }
        return false;
    }

    checkClose(code) {
        if (CONFIG.BAN_CLOSE_CODES.includes(code)) {
            this.trigger(`Disconnect code ${code}`);
        }
    }

    checkStreamError(code) {
        if (CONFIG.STREAM_ERROR_CODES.includes(code)) {
            this.trigger(`Stream error code ${code}`);
        }
    }

    trigger(reason) {
        if (this.triggered) return;
        this.triggered = true;

        const cooldownUntil = Date.now() + CONFIG.COOLDOWN_MINUTES * 60000;
        saveGuard({
            cooldownUntil,
            reason,
            lastTrigger: new Date().toISOString()
        });

        this.logger.error(`\n🛡️ [BAN_SENTINEL] ${reason}`);
        this.logger.error(`🛡️ Cooldown until: ${new Date(cooldownUntil).toLocaleString('id-ID')}`);
        this.logger.error(`🛡️ Closing socket to prevent permanent ban...\n`);

        try {
            if (this.sock?.end) this.sock.end(new Error('BAN_SENTINEL_TRIGGERED'));
            if (this.sock?.ws?.close) this.sock.ws.close();
        } catch (e) {
            this.logger.error('[BAN_SENTINEL] Failed to close socket:', e.message);
        }
    }
}

export function getSentinel(sock, logger) {
    if (!sentinels.has(sock)) {
        sentinels.set(sock, new BanSentinel(sock, logger));
    }
    return sentinels.get(sock);
}

export { CONFIG, loadGuard, saveGuard };