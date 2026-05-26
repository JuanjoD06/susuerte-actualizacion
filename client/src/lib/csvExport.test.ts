import { describe, it, expect } from 'vitest';
import { generateCSVContent, CSVExportRecord } from './csvExport';

describe('CSV Export Utility', () => {
  const mockRecords: CSVExportRecord[] = [
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@example.com',
      telefono: '1234567890',
      documento: 'DOC123',
      verificado: 'pendiente',
      deviceType: 'mobile',
      browser: 'Chrome',
      os: 'iOS',
      createdAt: '2026-05-26T10:00:00Z',
    },
    {
      id: 2,
      nombre: 'María García',
      email: 'maria@example.com',
      telefono: '9876543210',
      documento: 'DOC456',
      verificado: 'verificado',
      deviceType: 'desktop',
      browser: 'Firefox',
      os: 'Windows',
      createdAt: '2026-05-26T11:00:00Z',
    },
  ];

  it('should generate CSV content with headers', () => {
    const csv = generateCSVContent(mockRecords);
    
    expect(csv).toBeDefined();
    expect(csv).toContain('ID,Nombre,Email');
  });

  it('should include all required columns', () => {
    const csv = generateCSVContent(mockRecords);
    
    const headers = csv.split('\n')[0];
    expect(headers).toContain('ID');
    expect(headers).toContain('Nombre');
    expect(headers).toContain('Email');
    expect(headers).toContain('Teléfono');
    expect(headers).toContain('Documento');
    expect(headers).toContain('Estado');
    expect(headers).toContain('Dispositivo');
    expect(headers).toContain('Navegador');
    expect(headers).toContain('SO');
    expect(headers).toContain('Fecha');
  });

  it('should properly escape quotes in CSV values', () => {
    const recordsWithQuotes: CSVExportRecord[] = [
      {
        id: 1,
        nombre: 'Test "User" Name',
        email: 'test@example.com',
        documento: 'DOC"123',
        verificado: 'pendiente',
        createdAt: '2026-05-26T10:00:00Z',
      },
    ];

    const csv = generateCSVContent(recordsWithQuotes);
    
    // Quotes should be escaped as ""
    expect(csv).toContain('Test ""User"" Name');
    expect(csv).toContain('DOC""123');
  });

  it('should handle empty optional fields', () => {
    const recordsWithoutOptional: CSVExportRecord[] = [
      {
        id: 1,
        nombre: 'Test User',
        email: 'test@example.com',
        documento: 'DOC123',
        verificado: 'pendiente',
        createdAt: '2026-05-26T10:00:00Z',
      },
    ];

    const csv = generateCSVContent(recordsWithoutOptional);
    
    expect(csv).toBeDefined();
    expect(csv).toContain('Test User');
  });

  it('should return empty string for empty records array', () => {
    const csv = generateCSVContent([]);
    
    expect(csv).toBe('');
  });

  it('should include all record data in CSV', () => {
    const csv = generateCSVContent(mockRecords);
    
    expect(csv).toContain('Juan Pérez');
    expect(csv).toContain('juan@example.com');
    expect(csv).toContain('María García');
    expect(csv).toContain('maria@example.com');
  });

  it('should properly format multiple records', () => {
    const csv = generateCSVContent(mockRecords);
    
    const lines = csv.split('\n');
    expect(lines.length).toBe(3); // Header + 2 records
  });

  it('should handle special characters in names', () => {
    const recordsWithSpecialChars: CSVExportRecord[] = [
      {
        id: 1,
        nombre: 'José María Rodríguez',
        email: 'jose@example.com',
        documento: 'DOC123',
        verificado: 'pendiente',
        createdAt: '2026-05-26T10:00:00Z',
      },
    ];

    const csv = generateCSVContent(recordsWithSpecialChars);
    
    expect(csv).toContain('José María Rodríguez');
  });

  it('should wrap all values in quotes', () => {
    const csv = generateCSVContent(mockRecords);
    
    const lines = csv.split('\n');
    const firstDataLine = lines[1];
    
    // Each field should be wrapped in quotes
    expect(firstDataLine).toMatch(/^".*".*".*".*".*".*".*".*".*".*"$/);
  });
});
