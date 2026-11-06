import { DEFAULT_CONNECTION_CONFIG } from '../Defaults/index.js';
import { makeCommunitiesSocket } from './communities.js';
import { isOnCooldown, getCooldownRemaining } from '../Utils/ban-sentinel.js';
import { EventEmitter } from 'events';

// export the last socket layer
const makeWASocket = (config) => {
    // 🛡️ BAN SENTINEL: Tolak buat socket jika masih cooldown
    if (isOnCooldown()) {
        const remaining = getCooldownRemaining();
        const msg = `🛡️ [BAN_SENTINEL] Cooldown aktif: ${remaining} menit. Socket TIDAK dibuat.`;
        
        if (config.logger && typeof config.logger.error === 'function') {
            config.logger.error(msg);
        } else {
            console.error(msg);
        }
        
        // Return dummy socket agar bot tidak crash saat proses inisialisasi
        const dummyEv = new EventEmitter();
        dummyEv.buffer = () => {};
        dummyEv.flush = () => {};
        dummyEv.destroy = () => {};
        
        return {
            ev: dummyEv,
            user: null,
            type: 'md',
            end: () => {},
            logout: () => {},
            ws: { close: () => {}, isOpen: false, isClosed: true },
            sendMessage: async () => { throw new Error('BAN_SENTINEL_COOLDOWN'); },
            relayMessage: async () => { throw new Error('BAN_SENTINEL_COOLDOWN'); },
            __banGuardActive: true
        };
    }

    const newConfig = {
        ...DEFAULT_CONNECTION_CONFIG,
        ...config
    };
    return makeCommunitiesSocket(newConfig);
};

export default makeWASocket;
//# sourceMappingURL=index.js.map