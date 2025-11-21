"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptPayload = exports.encryptPayload = exports.signPayload = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const signPayload = (payload) => crypto_1.default.createHmac('sha256', env_1.env.deviceHmacSecret).update(payload).digest('hex');
exports.signPayload = signPayload;
const encryptPayload = (plaintext, iv = crypto_1.default.randomBytes(16)) => {
    const key = Buffer.from(env_1.env.deviceAesSecret, 'utf8');
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return { iv: iv.toString('base64'), ciphertext: encrypted };
};
exports.encryptPayload = encryptPayload;
const decryptPayload = (ciphertext, iv) => {
    const key = Buffer.from(env_1.env.deviceAesSecret, 'utf8');
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptPayload = decryptPayload;
//# sourceMappingURL=crypto.js.map