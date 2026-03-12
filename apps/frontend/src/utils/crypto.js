    // crypto.js — Client-side E2E encryption using Web Crypto API
// No external libraries — uses browser's built-in SubtleCrypto
// Key is derived from password + userId using PBKDF2, never sent to server

const ALGO        = 'AES-GCM';
const KEY_LENGTH  = 256;
const PBKDF2_ITER = 310_000; // OWASP recommended minimum
const SALT_LENGTH = 16;
const IV_LENGTH   = 12;

// ── Key derivation ────────────────────────────────────────────────────────────

const getUserSalt = async (userId) => {
    const data = new TextEncoder().encode('mhp-salt-v1-' + userId);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hash).slice(0, SALT_LENGTH);
};

export const deriveKey = async (password, userId) => {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    const salt = await getUserSalt(userId);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITER, hash: 'SHA-256' },
        keyMaterial,
        { name: ALGO, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
};

// ── Encrypt ───────────────────────────────────────────────────────────────────
// Returns "enc:base64iv:base64ciphertext"
export const encrypt = async (plaintext, key) => {
    if (!plaintext || !key) return plaintext;
    try {
        const iv     = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
        const cipher = await crypto.subtle.encrypt(
            { name: ALGO, iv },
            key,
            new TextEncoder().encode(plaintext)
        );
        const ivB64 = btoa(String.fromCharCode(...iv));
        const ctB64 = btoa(String.fromCharCode(...new Uint8Array(cipher)));
        return `enc:${ivB64}:${ctB64}`;
    } catch (err) {
        console.error('[crypto] encrypt error:', err);
        return plaintext;
    }
};

// ── Decrypt ───────────────────────────────────────────────────────────────────
export const decrypt = async (ciphertext, key) => {
    if (!ciphertext || !key) return ciphertext;
    if (!String(ciphertext).startsWith('enc:')) return ciphertext; // migration-safe
    try {
        const [, ivB64, ctB64] = ciphertext.split(':');
        const iv     = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
        const ct     = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
        const plain  = await crypto.subtle.decrypt({ name: ALGO, iv }, key, ct);
        return new TextDecoder().decode(plain);
    } catch {
        return '[unable to decrypt — wrong password or corrupted]';
    }
};

// ── Bulk helpers ──────────────────────────────────────────────────────────────
export const encryptMessages = async (messages, key) =>
    Promise.all(messages.map(async m => ({ ...m, content: await encrypt(m.content, key) })));

export const decryptMessages = async (messages, key) =>
    Promise.all(messages.map(async m => ({ ...m, content: await decrypt(m.content, key) })));

// ── Session helpers ───────────────────────────────────────────────────────────
// Password stored temporarily in sessionStorage (cleared on tab close)
// CryptoKey objects live only in JS memory — never serialised
const SESSION_KEY = 'mhp_enc_pw';

export const savePasswordToSession  = (pw) => sessionStorage.setItem(SESSION_KEY, pw);
export const getPasswordFromSession = ()   => sessionStorage.getItem(SESSION_KEY);
export const clearEncryptionSession = ()   => sessionStorage.removeItem(SESSION_KEY);
export const hasEncryptionSetup     = ()   => !!sessionStorage.getItem(SESSION_KEY);