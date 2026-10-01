import {
  comparePassword,
  decrypt,
  encrypt,
  generateAPIKey,
  generateToken,
  hashPassword,
} from '../../../src/utils';

describe('crypto utils', () => {
  it('encrypts and decrypts data', () => {
    const plain = 'sensitive';
    const encrypted = encrypt(plain);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('throws for malformed encrypted data', () => {
    expect(() => decrypt('invalid-payload')).toThrow('Invalid encrypted value');
  });

  it('hashes and compares password', async () => {
    const hash = await hashPassword('Password@123');
    expect(await comparePassword('Password@123', hash)).toBe(true);
  });

  it('generates token and api key', () => {
    expect(generateToken(16)).toHaveLength(32);
    expect(generateAPIKey().startsWith('dk_')).toBe(true);
  });
});
