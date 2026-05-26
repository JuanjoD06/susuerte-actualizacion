import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createEmailVerificationToken, verifyEmailToken, deleteEmailVerificationToken } from './db';

describe('Email Verification Router Procedures', () => {
  let testToken: string;

  beforeAll(() => {
    console.log('Starting email verification router tests...');
  });

  afterAll(() => {
    console.log('Email verification router tests completed');
  });

  it('should create email verification token with correct format', async () => {
    const tokenResult = await createEmailVerificationToken(1, 'test@example.com');
    
    expect(tokenResult).toBeDefined();
    expect(tokenResult?.token).toBeDefined();
    expect(tokenResult?.token).toMatch(/^[a-f0-9]{64}$/);
    expect(tokenResult?.expiresAt).toBeDefined();
    
    testToken = tokenResult?.token || '';
  });

  it('should verify a valid token', async () => {
    if (!testToken) {
      throw new Error('Test token not created');
    }

    const verifiedToken = await verifyEmailToken(testToken);
    expect(verifiedToken).toBeDefined();
    expect(verifiedToken?.token).toBe(testToken);
    expect(verifiedToken?.registroId).toBe(1);
    expect(verifiedToken?.email).toBe('test@example.com');
  });

  it('should reject invalid token formats', async () => {
    const invalidTokens = [
      '',
      'short',
      'not-a-hex-token',
      '0'.repeat(63), // 63 chars instead of 64
      'g'.repeat(64), // invalid hex chars
    ];

    for (const invalidToken of invalidTokens) {
      const result = await verifyEmailToken(invalidToken);
      expect(result).toBeUndefined();
    }
  });

  it('should handle non-existent tokens', async () => {
    const validHexToken = 'a'.repeat(64);
    const result = await verifyEmailToken(validHexToken);
    
    expect(result).toBeUndefined();
  });

  it('should delete a token', async () => {
    if (!testToken) {
      throw new Error('Test token not created');
    }

    await deleteEmailVerificationToken(testToken);
    
    // Try to verify the deleted token
    const result = await verifyEmailToken(testToken);
    expect(result).toBeUndefined();
  });

  it('should generate unique tokens', async () => {
    const token1 = await createEmailVerificationToken(2, 'unique1@example.com');
    const token2 = await createEmailVerificationToken(3, 'unique2@example.com');
    
    expect(token1?.token).toBeDefined();
    expect(token2?.token).toBeDefined();
    expect(token1?.token).not.toBe(token2?.token);
  });

  it('should handle multiple tokens for same registro', async () => {
    const token1 = await createEmailVerificationToken(4, 'multi@example.com');
    const token2 = await createEmailVerificationToken(4, 'multi@example.com');
    
    expect(token1?.token).toBeDefined();
    expect(token2?.token).toBeDefined();
    expect(token1?.token).not.toBe(token2?.token);
    
    // Both tokens should be verifiable
    const verified1 = await verifyEmailToken(token1?.token || '');
    const verified2 = await verifyEmailToken(token2?.token || '');
    
    expect(verified1).toBeDefined();
    expect(verified2).toBeDefined();
  });

  it('should have expiration time set correctly', async () => {
    const tokenResult = await createEmailVerificationToken(5, 'expiry@example.com');
    
    expect(tokenResult?.expiresAt).toBeDefined();
    
    // Check that expiration is in the future
    const expiryTime = new Date(tokenResult?.expiresAt || 0).getTime();
    const now = Date.now();
    
    expect(expiryTime).toBeGreaterThan(now);
    
    // Check that expiration is approximately 24 hours from now
    const hoursUntilExpiry = (expiryTime - now) / (1000 * 60 * 60);
    expect(hoursUntilExpiry).toBeGreaterThan(23);
    expect(hoursUntilExpiry).toBeLessThan(25);
  });
});
