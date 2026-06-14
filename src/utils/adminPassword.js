const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update('tryon-admin-secret-key-2024').digest();
const FILE = path.join(__dirname, '..', '..', 'admin.enc');

function decrypt(encrypted, authTag, iv) {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function getEncryptedPassword() {
  if (!fs.existsSync(FILE)) return null;
  const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  return decrypt(raw.data, raw.authTag, raw.iv);
}

module.exports = { getEncryptedPassword };
