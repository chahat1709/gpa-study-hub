const crypto = require('crypto');
const pino = require('pino');

const log = pino({ name: 'encryption' });

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

// Master encryption key (rotate in production)
const MASTER_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(KEY_LENGTH).toString('hex');

function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, KEY_LENGTH, 'sha512');
}

function encrypt(plaintext, context = 'default') {
  try {
    const salt = crypto.randomBytes(16);
    const key = deriveKey(MASTER_KEY, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });

    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);

    const tag = cipher.getAuthTag();

    // Format: salt:iv:tag:encrypted (all hex)
    return [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted.toString('hex'),
    ].join(':');
  } catch (e) {
    log.error({ err: e }, 'Encryption failed');
    throw new Error('Encryption failed');
  }
}

function decrypt(ciphertext, context = 'default') {
  try {
    const [saltHex, ivHex, tagHex, encryptedHex] = ciphertext.split(':');

    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');

    const key = deriveKey(MASTER_KEY, salt);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return decrypted.toString('utf8');
  } catch (e) {
    log.error({ err: e }, 'Decryption failed');
    throw new Error('Decryption failed');
  }
}

// Hash sensitive data (one-way)
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Generate secure random tokens
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = { encrypt, decrypt, hashData, generateToken };
