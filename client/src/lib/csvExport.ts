/**
 * CSV Export Utility
 * Provides functions to generate and download CSV files
 */

export interface CSVExportRecord {
  id: number;
  nombre: string;
  email: string;
  telefono?: string | null;
  documento: string;
  verificado: string;
  deviceType?: string | null;
  browser?: string | null;
  os?: string | null;
  createdAt: string | Date;
}

/**
 * Generates CSV content from an array of records
 * @param records Array of records to export
 * @returns CSV content as string
 */
export function generateCSVContent(records: CSVExportRecord[]): string {
  if (records.length === 0) {
    return '';
  }

  const headers = ['ID', 'Nombre', 'Email', 'Teléfono', 'Documento', 'Estado', 'Dispositivo', 'Navegador', 'SO', 'Fecha'];
  
  const rows = records.map(registro => [
    String(registro.id),
    registro.nombre,
    registro.email,
    registro.telefono || '',
    registro.documento,
    registro.verificado,
    registro.deviceType || '',
    registro.browser || '',
    registro.os || '',
    new Date(registro.createdAt).toLocaleString('es-ES'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Downloads CSV content as a file
 * @param csvContent CSV content string
 * @param filename Filename for the download
 */
export function downloadCSVFile(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports records to CSV file
 * @param records Array of records to export
 * @param filename Optional filename (default: susuerte-registros-YYYY-MM-DD.csv)
 */
export function exportToCSV(records: CSVExportRecord[], filename?: string): void {
  if (records.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const csvContent = generateCSVContent(records);
  
  if (!csvContent) {
    throw new Error('No se pudo generar el contenido CSV');
  }

  const defaultFilename = `susuerte-registros-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSVFile(csvContent, filename || defaultFilename);
}

export interface UserEventCSVRecord {
  id: string;
  sessionId: string;
  eventType: string;
  timestamp: string;
  ipPublica: string;
  ipPrivada: string;
  navegador: string;
  sistemaOperativo: string;
  dispositivo: string;
  tiempoActivo: number;
  paginaVisitada: string;
  email?: string;
  nombre?: string;
}

/**
 * Generates CSV content from an array of event records
 * @param events Array of events to export
 * @returns CSV content as string
 */
export function generateEventsCSVContent(events: UserEventCSVRecord[]): string {
  if (events.length === 0) {
    return '';
  }

  const headers = ['ID', 'Sesion', 'Tipo de Evento', 'Timestamp', 'IP Publica', 'IP Privada', 'Navegador', 'SO', 'Dispositivo', 'Tiempo Activo (ms)', 'Pagina Visitada', 'Email', 'Nombre'];
  
  const rows = events.map(evento => [
    evento.id,
    evento.sessionId,
    evento.eventType,
    new Date(evento.timestamp).toLocaleString('es-ES'),
    evento.ipPublica,
    evento.ipPrivada,
    evento.navegador,
    evento.sistemaOperativo,
    evento.dispositivo,
    String(evento.tiempoActivo),
    evento.paginaVisitada,
    evento.email || '',
    evento.nombre || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Exports events to CSV file
 * @param events Array of events to export
 * @param filename Optional filename (default: susuerte-logs-YYYY-MM-DD.csv)
 */
export function exportEventsToCSV(events: UserEventCSVRecord[], filename?: string): void {
  if (events.length === 0) {
    throw new Error('No hay eventos para exportar');
  }

  const csvContent = generateEventsCSVContent(events);
  
  if (!csvContent) {
    throw new Error('No se pudo generar el contenido CSV');
  }

  const defaultFilename = `susuerte-logs-${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSVFile(csvContent, filename || defaultFilename);
}
