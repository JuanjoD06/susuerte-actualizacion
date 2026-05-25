/**
 * Utilidades de Exportación
 * Exportar datos a CSV y JSON
 */

export interface RegistroUsuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  verificado: boolean;
  timestamp: string;
  deviceData: any;
  sessionId: string;
}

export interface UserEvent {
  id: string;
  sessionId: string;
  eventType: string;
  timestamp: string;
  ipPublica: string;
  ipPrivada: string;
  userAgent: string;
  navegador: string;
  sistemaOperativo: string;
  dispositivo: string;
  tiempoActivo: number;
  paginaVisitada: string;
  email?: string;
  nombre?: string;
  detalles?: any;
}

/**
 * Exportar registros de usuarios a CSV
 */
export function exportarUsuariosCSV(registros: RegistroUsuario[]): void {
  const headers = [
    'ID',
    'Nombre',
    'Email',
    'Teléfono',
    'Documento',
    'Verificado',
    'Timestamp',
    'IP Pública',
    'IP Privada',
    'Navegador',
    'Sistema Operativo',
    'Dispositivo',
  ];

  const rows = registros.map(r => [
    r.id,
    r.nombre,
    r.email,
    r.telefono,
    r.documento,
    r.verificado ? 'Sí' : 'No',
    r.timestamp,
    r.deviceData?.publicIP || 'N/A',
    r.deviceData?.privateIP || 'N/A',
    r.deviceData?.browser || 'N/A',
    r.deviceData?.os || 'N/A',
    r.deviceData?.device || 'N/A',
  ]);

  downloadCSV(headers, rows, 'usuarios.csv');
}

/**
 * Exportar eventos a CSV
 */
export function exportarEventosCSV(eventos: UserEvent[]): void {
  const headers = [
    'ID',
    'Session ID',
    'Tipo de Evento',
    'Timestamp',
    'IP Pública',
    'IP Privada',
    'Navegador',
    'Sistema Operativo',
    'Dispositivo',
    'Tiempo Activo (ms)',
    'Email',
    'Nombre',
  ];

  const rows = eventos.map(e => [
    e.id,
    e.sessionId,
    e.eventType,
    e.timestamp,
    e.ipPublica,
    e.ipPrivada,
    e.navegador,
    e.sistemaOperativo,
    e.dispositivo,
    e.tiempoActivo,
    e.email || 'N/A',
    e.nombre || 'N/A',
  ]);

  downloadCSV(headers, rows, 'eventos.csv');
}

/**
 * Exportar sesiones a CSV
 */
export function exportarSesionesCSV(eventos: UserEvent[]): void {
  const sessionMap = new Map<string, UserEvent[]>();

  eventos.forEach(evento => {
    if (!sessionMap.has(evento.sessionId)) {
      sessionMap.set(evento.sessionId, []);
    }
    sessionMap.get(evento.sessionId)!.push(evento);
  });

  const headers = [
    'Session ID',
    'Email',
    'Nombre',
    'Inicio Sesión',
    'Última Actividad',
    'Tiempo Total (ms)',
    'Total Eventos',
    'IP Pública',
    'Dispositivo',
  ];

  const rows = Array.from(sessionMap.entries()).map(([sessionId, sessionEventos]) => {
    const primerEvento = sessionEventos[0];
    const ultimoEvento = sessionEventos[sessionEventos.length - 1];
    const tiempoTotal = new Date(ultimoEvento.timestamp).getTime() - new Date(primerEvento.timestamp).getTime();

    return [
      sessionId,
      primerEvento.email || 'N/A',
      primerEvento.nombre || 'N/A',
      primerEvento.timestamp,
      ultimoEvento.timestamp,
      tiempoTotal,
      sessionEventos.length,
      primerEvento.ipPublica,
      primerEvento.dispositivo,
    ];
  });

  downloadCSV(headers, rows, 'sesiones.csv');
}

/**
 * Exportar métricas a CSV
 */
export function exportarMetricasCSV(metricas: Record<string, any>): void {
  const headers = ['Métrica', 'Valor'];
  const rows = Object.entries(metricas).map(([key, value]) => [key, String(value)]);

  downloadCSV(headers, rows, 'metricas.csv');
}

/**
 * Exportar dispositivos a CSV
 */
export function exportarDispositivosCSV(eventos: UserEvent[]): void {
  const dispositivoMap = new Map<string, number>();

  eventos.forEach(evento => {
    dispositivoMap.set(
      evento.dispositivo,
      (dispositivoMap.get(evento.dispositivo) || 0) + 1
    );
  });

  const headers = ['Dispositivo', 'Total Eventos'];
  const rows = Array.from(dispositivoMap.entries()).map(([device, count]) => [device, count]);

  downloadCSV(headers, rows, 'dispositivos.csv');
}

/**
 * Descargar CSV
 */
function downloadCSV(headers: string[], rows: any[][], filename: string): void {
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      row.map((cell: any) => {
        const value = String(cell).replace(/"/g, '""');
        return value.includes(',') || value.includes('"') || value.includes('\n')
          ? `"${value}"`
          : value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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
 * Exportar todos los datos a JSON
 */
export function exportarTodoJSON(
  registros: RegistroUsuario[],
  eventos: UserEvent[],
  metricas: Record<string, any>
): void {
  const data = {
    exportDate: new Date().toISOString(),
    registros,
    eventos,
    metricas,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'datos_completos.json');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exportar registros a JSON
 */
export function exportarUsuariosJSON(registros: RegistroUsuario[]): void {
  const json = JSON.stringify(registros, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'usuarios.json');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exportar eventos a JSON
 */
export function exportarEventosJSON(eventos: UserEvent[]): void {
  const json = JSON.stringify(eventos, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'eventos.json');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
