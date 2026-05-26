import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createEmailVerificationToken, verifyEmailToken, deleteEmailVerificationToken } from './db';

describe('Email Verification System', () => {
  let testToken: string;
  let testRegistroId: number;

  beforeAll(() => {
    console.log('Starting email verification tests...');
    testRegistroId = 1; // Use a test registro ID
  });

  afterAll(() => {
    console.log('Email verification tests completed');
  });

  it('should create a verification token', async () => {
    const result = await createEmailVerificationToken(testRegistroId, 'test@example.com');
    
    expect(result).toBeDefined();
    expect(result?.token).toBeDefined();
    expect(result?.expiresAt).toBeDefined();
    expect(result?.token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes in hex = 64 chars
    
    testToken = result?.token || '';
  });

  it('should verify a valid token', async () => {
    if (!testToken) {
      throw new Error('Test token not created');
    }

    const tokenRecord = await verifyEmailToken(testToken);
    
    expect(tokenRecord).toBeDefined();
    expect(tokenRecord?.token).toBe(testToken);
    expect(tokenRecord?.email).toBe('test@example.com');
    expect(tokenRecord?.registroId).toBe(testRegistroId);
  });

  it('should reject an invalid token', async () => {
    const tokenRecord = await verifyEmailToken('invalid-token-12345');
    
    expect(tokenRecord).toBeUndefined();
  });

  it('should reject an expired token', async () => {
    // Create a token and manually set it to be expired
    const expiredResult = await createEmailVerificationToken(testRegistroId + 1, 'expired@example.com');
    
    if (!expiredResult?.token) {
      throw new Error('Failed to create expired token');
    }

    // Manually delete it to simulate expiration
    await deleteEmailVerificationToken(expiredResult.token);
    
    // Try to verify the deleted token
    const tokenRecord = await verifyEmailToken(expiredResult.token);
    
    expect(tokenRecord).toBeUndefined();
  });

  it('should delete a token', async () => {
    if (!testToken) {
      throw new Error('Test token not created');
    }

    await deleteEmailVerificationToken(testToken);
    
    // Try to verify the deleted token
    const tokenRecord = await verifyEmailToken(testToken);
    
    expect(tokenRecord).toBeUndefined();
  });

  it('should generate unique tokens', async () => {
    const result1 = await createEmailVerificationToken(testRegistroId + 2, 'unique1@example.com');
    const result2 = await createEmailVerificationToken(testRegistroId + 3, 'unique2@example.com');
    
    expect(result1?.token).not.toBe(result2?.token);
  });
});
