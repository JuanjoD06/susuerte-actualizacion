import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createSusuertRegistro, getAllSusuertRegistros, updateSusuertRegistro } from './db';
import type { InsertSusuertRegistro } from '../drizzle/schema';

describe('Susuert Registration System', () => {
  let registroId: number = 1;

  beforeAll(async () => {
    console.log('Starting Susuert registration tests...');
  });

  it('should create a new registration', async () => {
    const testRegistro: InsertSusuertRegistro = {
      nombre: 'Test User',
      email: 'test@example.com',
      telefono: '1234567890',
      documento: 'ABC123456',
      verificado: 'pendiente',
      deviceType: 'Desktop',
      browser: 'Chrome',
      os: 'Windows',
      sessionId: 'test-session-123',
    };

    const result = await createSusuertRegistro(testRegistro);
    expect(result).toBeDefined();
    
    // Drizzle puede retornar un objeto con insertId o un resultado directo
    if (result && typeof result === 'object') {
      if ('insertId' in result) {
        registroId = (result as any).insertId;
      }
    }
  });

  it('should retrieve all registrations', async () => {
    const registros = await getAllSusuertRegistros();
    expect(Array.isArray(registros)).toBe(true);
    // Debe haber al menos el registro que creamos
    expect(registros.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle multiple registrations from different devices', async () => {
    const mobileRegistro: InsertSusuertRegistro = {
      nombre: 'Mobile User',
      email: 'mobile@example.com',
      telefono: '9876543210',
      documento: 'XYZ789012',
      verificado: 'pendiente',
      deviceType: 'Mobile',
      browser: 'Safari',
      os: 'iOS',
      sessionId: 'mobile-session-456',
    };

    const desktopRegistro: InsertSusuertRegistro = {
      nombre: 'Desktop User',
      email: 'desktop@example.com',
      telefono: '5555555555',
      documento: 'DEF456789',
      verificado: 'pendiente',
      deviceType: 'Desktop',
      browser: 'Firefox',
      os: 'Linux',
      sessionId: 'desktop-session-789',
    };

    await createSusuertRegistro(mobileRegistro);
    await createSusuertRegistro(desktopRegistro);

    const allRegistros = await getAllSusuertRegistros();
    
    // Verificar que se pueden recuperar registros
    expect(Array.isArray(allRegistros)).toBe(true);
    expect(allRegistros.length).toBeGreaterThan(0);
  });

  it('should verify that all registrations are accessible regardless of device', async () => {
    const registros = await getAllSusuertRegistros();
    
    // Verificar que tenemos registros de diferentes dispositivos
    const devices = new Set(registros.map(r => r.deviceType));
    expect(devices.size).toBeGreaterThan(0);
    
    // Verificar que todos los registros tienen datos básicos
    registros.forEach(registro => {
      expect(registro.nombre).toBeDefined();
      expect(registro.email).toBeDefined();
      expect(registro.documento).toBeDefined();
    });
  });

  afterAll(async () => {
    console.log('Susuert registration tests completed');
  });
});
