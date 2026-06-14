const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ALGORITHM = 'aes-256-gcm';
const KEY = crypto.createHash('sha256').update(process.env.ADMIN_ENC_KEY).digest();
const FILE = path.join(__dirname, '..', 'admin.enc');

function encrypt(text, iv) {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { encrypted, authTag };
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Enter admin password to encrypt: ', (password) => {
  rl.close();
  const iv = crypto.randomBytes(16);
  const { encrypted, authTag } = encrypt(password, iv);
  const data = {
    iv: iv.toString('hex'),
    authTag,
    data: encrypted,
  };
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  console.log(`Admin password encrypted and saved to ${FILE}`);
});
