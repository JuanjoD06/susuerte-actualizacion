/**
 * Utilidades de Análisis y Métricas
 * Cálculo de estadísticas avanzadas para el dashboard
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

export interface MetricasGenerales {
  totalClics: number;
  totalRegistros: number;
  usuariosUnicos: number;
  ipsUnicas: number;
  usuariosVulnerables: number;
  usuariosSospechosos: number;
  conversionPhishing: string;
  tiempoPromedioPermanencia: string;
  navegadorMasUsado: string;
  sistemaOperativoMasUsado: string;
  usuariosMobiles: number;
  usuariosDesktop: number;
}

/**
 * Calcular todas las métricas generales
 */
export function calcularMetricasGenerales(
  registros: RegistroUsuario[],
  eventos: UserEvent[]
): MetricasGenerales {
  const totalClics = eventos.filter(e => e.eventType === 'BUTTON_CLICK').length;
  const totalRegistros = registros.length;
  const usuariosUnicos = new Set(eventos.map(e => e.email)).size;
  const ipsUnicas = new Set(eventos.map(e => e.ipPublica)).size;
  const usuariosVulnerables = registros.length;
  const usuariosSospechosos = eventos
    .filter(e => e.eventType === 'FORM_ABANDON')
    .map(e => e.email)
    .filter((v, i, a) => a.indexOf(v) === i).length;

  const conversionPhishing = totalClics > 0 
    ? ((totalRegistros / totalClics) * 100).toFixed(2) 
    : '0.00';

  const tiempoPromedioPermanencia = eventos.length > 0
    ? ((eventos.reduce((sum, e) => sum + e.tiempoActivo, 0) / eventos.length) / 1000).toFixed(1)
    : '0';

  const navegadores = eventos.reduce((acc, e) => {
    acc[e.navegador] = (acc[e.navegador] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const navegadorMasUsado = Object.entries(navegadores).length > 0
    ? Object.entries(navegadores).sort((a, b) => b[1] - a[1])[0][0]
    : 'Desconocido';

  const sistemaOperativos = eventos.reduce((acc, e) => {
    acc[e.sistemaOperativo] = (acc[e.sistemaOperativo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sistemaOperativoMasUsado = Object.entries(sistemaOperativos).length > 0
    ? Object.entries(sistemaOperativos).sort((a, b) => b[1] - a[1])[0][0]
    : 'Desconocido';

  const usuariosMobiles = eventos.filter(e => e.dispositivo === 'Móvil').length;
  const usuariosDesktop = eventos.filter(e => e.dispositivo === 'Desktop').length;

  return {
    totalClics,
    totalRegistros,
    usuariosUnicos,
    ipsUnicas,
    usuariosVulnerables,
    usuariosSospechosos,
    conversionPhishing,
    tiempoPromedioPermanencia: `${tiempoPromedioPermanencia}s`,
    navegadorMasUsado,
    sistemaOperativoMasUsado,
    usuariosMobiles,
    usuariosDesktop,
  };
}

/**
 * Detectar registros duplicados
 */
export function detectarDuplicados(registros: RegistroUsuario[]): {
  duplicados: RegistroUsuario[];
  unicos: RegistroUsuario[];
} {
  const emailMap = new Map<string, RegistroUsuario[]>();

  registros.forEach(registro => {
    if (!emailMap.has(registro.email)) {
      emailMap.set(registro.email, []);
    }
    emailMap.get(registro.email)!.push(registro);
  });

  const duplicados: RegistroUsuario[] = [];
  const unicos: RegistroUsuario[] = [];

  emailMap.forEach(registrosEmail => {
    if (registrosEmail.length > 1) {
      duplicados.push(...registrosEmail);
    } else {
      unicos.push(...registrosEmail);
    }
  });

  return { duplicados, unicos };
}

/**
 * Obtener estado del usuario
 */
export function obtenerEstadoUsuario(
  email: string,
  eventos: UserEvent[],
  registros: RegistroUsuario[]
): string {
  const usuarioRegistrado = registros.some(r => r.email === email);
  const eventosUsuario = eventos.filter(e => e.email === email);
  const tieneClics = eventosUsuario.some(e => e.eventType === 'BUTTON_CLICK');
  const tieneFormStart = eventosUsuario.some(e => e.eventType === 'FORM_START');
  const tieneFormSubmit = eventosUsuario.some(e => e.eventType === 'FORM_SUBMIT');
  const tieneAbandon = eventosUsuario.some(e => e.eventType === 'FORM_ABANDON');
  const intentos = eventosUsuario.filter(e => e.eventType === 'FORM_SUBMIT').length;

  if (intentos > 1) return 'Múltiples intentos';
  if (usuarioRegistrado && tieneFormSubmit) return 'Formulario enviado';
  if (tieneFormStart && !tieneFormSubmit) return 'Formulario parcial';
  if (tieneAbandon) return 'Abandono';
  if (tieneClics) return 'Solo clic';

  return 'Sin actividad';
}

/**
 * Generar resumen ejecutivo
 */
export function generarResumenEjecutivo(
  registros: RegistroUsuario[],
  eventos: UserEvent[]
): Record<string, string> {
  const metricas = calcularMetricasGenerales(registros, eventos);
  const totalEventos = eventos.length;
  
  const porcentajeVulnerables = totalEventos > 0
    ? ((metricas.usuariosVulnerables / metricas.usuariosUnicos) * 100).toFixed(1)
    : '0';

  const porcentajeAbandon = totalEventos > 0
    ? ((metricas.usuariosSospechosos / metricas.usuariosUnicos) * 100).toFixed(1)
    : '0';

  const tasaConversion = metricas.conversionPhishing;

  return {
    'Porcentaje de Usuarios Vulnerables': `${porcentajeVulnerables}%`,
    'Porcentaje de Abandono': `${porcentajeAbandon}%`,
    'Tasa de Conversión Phishing': `${tasaConversion}%`,
    'Usuarios Más Vulnerables': registros.slice(0, 3).map(r => r.nombre).join(', ') || 'N/A',
    'Horarios con Más Interacción': obtenerHorariosConMasInteraccion(eventos),
    'Dispositivos Más Usados': `Móvil: ${metricas.usuariosMobiles}, Desktop: ${metricas.usuariosDesktop}`,
    'Navegadores Más Usados': metricas.navegadorMasUsado,
  };
}

/**
 * Obtener horarios con más interacción
 */
function obtenerHorariosConMasInteraccion(eventos: UserEvent[]): string {
  const horariosMap = new Map<number, number>();

  eventos.forEach(evento => {
    const hora = new Date(evento.timestamp).getHours();
    horariosMap.set(hora, (horariosMap.get(hora) || 0) + 1);
  });

  const horariosOrdenados = Array.from(horariosMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hora, count]) => `${hora}:00 (${count} eventos)`);

  return horariosOrdenados.join(', ') || 'N/A';
}

/**
 * Obtener datos para gráfico de clics por hora
 */
export function obtenerClicsPorHora(eventos: UserEvent[]): Record<string, number> {
  const clicsPorHora: Record<string, number> = {};

  eventos
    .filter(e => e.eventType === 'BUTTON_CLICK')
    .forEach(evento => {
      const hora = new Date(evento.timestamp).getHours();
      const horaLabel = `${hora}:00`;
      clicsPorHora[horaLabel] = (clicsPorHora[horaLabel] || 0) + 1;
    });

  return clicsPorHora;
}

/**
 * Obtener datos para gráfico de registros por hora
 */
export function obtenerRegistrosPorHora(registros: RegistroUsuario[]): Record<string, number> {
  const registrosPorHora: Record<string, number> = {};

  registros.forEach(registro => {
    const hora = new Date(registro.timestamp).getHours();
    const horaLabel = `${hora}:00`;
    registrosPorHora[horaLabel] = (registrosPorHora[horaLabel] || 0) + 1;
  });

  return registrosPorHora;
}

/**
 * Obtener datos para gráfico de usuarios por navegador
 */
export function obtenerUsuariosPorNavegador(eventos: UserEvent[]): Record<string, number> {
  const usuariosPorNavegador: Record<string, number> = {};

  const navegadoresUnicos = new Set(eventos.map(e => e.navegador));
  navegadoresUnicos.forEach(navegador => {
    usuariosPorNavegador[navegador] = new Set(
      eventos
        .filter(e => e.navegador === navegador)
        .map(e => e.email)
    ).size;
  });

  return usuariosPorNavegador;
}

/**
 * Obtener datos para gráfico de usuarios por SO
 */
export function obtenerUsuariosPorSO(eventos: UserEvent[]): Record<string, number> {
  const usuariosPorSO: Record<string, number> = {};

  const sosUnicos = new Set(eventos.map(e => e.sistemaOperativo));
  sosUnicos.forEach(so => {
    usuariosPorSO[so] = new Set(
      eventos
        .filter(e => e.sistemaOperativo === so)
        .map(e => e.email)
    ).size;
  });

  return usuariosPorSO;
}

/**
 * Obtener datos para gráfico de dispositivos
 */
export function obtenerDispositivosChart(eventos: UserEvent[]): Record<string, number> {
  const dispositivos: Record<string, number> = {};

  eventos.forEach(evento => {
    dispositivos[evento.dispositivo] = (dispositivos[evento.dispositivo] || 0) + 1;
  });

  return dispositivos;
}

/**
 * Obtener datos para gráfico de eventos por tipo
 */
export function obtenerEventosPorTipo(eventos: UserEvent[]): Record<string, number> {
  const eventosPorTipo: Record<string, number> = {};

  eventos.forEach(evento => {
    eventosPorTipo[evento.eventType] = (eventosPorTipo[evento.eventType] || 0) + 1;
  });

  return eventosPorTipo;
}
