import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      }
    });

    const keysDir = path.join(__dirname, '..', 'keys');
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
      console.log(`Created directory: ${keysDir}`);
    }

    const publicKeyPath = path.join(keysDir, 'pharmacy_public.pem');
    const privateKeyPath = path.join(keysDir, 'pharmacy_private.pem');

    fs.writeFileSync(publicKeyPath, publicKey);
    fs.writeFileSync(privateKeyPath, privateKey); // Private key saved here

    console.log(`Public and Private keys generated successfully.`);
    console.log(`- Public Key saved to: ${publicKeyPath}`);
    console.log(`- Private Key saved to: ${privateKeyPath}`);
    console.log('---');
    console.log('Public Key (Share this with client applications like Careflow):');
    console.log(publicKey);
    console.log('---');
    console.error('\x1b[31m%s\x1b[0m', 'IMPORTANT: Secure the private key file (pharmacy_private.pem) and add it to your .gitignore!');
    console.error('\x1b[31m%s\x1b[0m', 'DO NOT commit the private key to version control.');

} catch (error) {
    console.error("Error generating keys:", error);
    process.exit(1);
}




