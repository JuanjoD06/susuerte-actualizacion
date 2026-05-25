/**
 * Sistema de Eventos Detallados para Phishing Awareness
 * Registra todos los eventos del usuario con trazabilidad completa
 */

export type EventType = 'PAGE_VISIT' | 'BUTTON_CLICK' | 'FORM_START' | 'FORM_SUBMIT' | 'FORM_ABANDON' | 'MULTI_ATTEMPT';

export interface UserEvent {
  id: string;
  sessionId: string;
  eventType: EventType;
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

export interface SessionMetrics {
  sessionId: string;
  inicioSesion: string;
  ultimaActividad: string;
  tiempoTotal: number;
  eventos: UserEvent[];
  estado: 'activa' | 'completada' | 'abandonada';
}

let sessionId = '';
let sessionStartTime = 0;
let eventos: UserEvent[] = [];

/**
 * Inicializar sesión de usuario
 */
export function initializeSession() {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStartTime = Date.now();
  
  // Registrar visita de página
  trackEvent('PAGE_VISIT', {
    paginaVisitada: window.location.pathname,
  });
  
  return sessionId;
}

/**
 * Registrar evento de usuario
 */
export async function trackEvent(
  eventType: EventType,
  detalles?: any
) {
  if (!sessionId) {
    initializeSession();
  }

  const deviceData = await getDeviceData();
  
  const evento: UserEvent = {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    eventType,
    timestamp: new Date().toISOString(),
    ipPublica: deviceData.publicIP || 'Desconocida',
    ipPrivada: deviceData.privateIP || 'No disponible',
    userAgent: navigator.userAgent,
    navegador: deviceData.browser || 'Desconocido',
    sistemaOperativo: deviceData.os || 'Desconocido',
    dispositivo: deviceData.device || 'Desconocido',
    tiempoActivo: Date.now() - sessionStartTime,
    paginaVisitada: window.location.pathname,
    detalles,
  };

  eventos.push(evento);
  
  // Guardar en localStorage
  const eventosGuardados = localStorage.getItem('susuerte_eventos') || '[]';
  const eventosArray = JSON.parse(eventosGuardados);
  eventosArray.push(evento);
  localStorage.setItem('susuerte_eventos', JSON.stringify(eventosArray));

  return evento;
}

/**
 * Obtener datos del dispositivo
 */
async function getDeviceData() {
  const publicIP = await getPublicIP();
  const privateIP = await getPrivateIP();
  const browser = detectBrowser();
  const os = detectOS();
  const device = detectDevice();

  return {
    publicIP,
    privateIP,
    browser,
    os,
    device,
  };
}

/**
 * Obtener IP pública
 */
async function getPublicIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Desconocida';
  }
}

/**
 * Obtener IP privada usando WebRTC
 */
async function getPrivateIP(): Promise<string> {
  return new Promise((resolve) => {
    const pc = new (window as any).RTCPeerConnection({ iceServers: [] });
    const ips: Set<string> = new Set();

    pc.createDataChannel('');
    pc.createOffer().then((offer: any) => {
      pc.setLocalDescription(offer);
    });

    pc.onicecandidate = (ice: any) => {
      if (!ice || !ice.candidate) {
        pc.close();
        resolve(ips.size > 0 ? Array.from(ips)[0] : 'No disponible');
        return;
      }

      const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
      const ipAddress = ipRegex.exec(ice.candidate.candidate)?.[1];
      if (ipAddress) {
        ips.add(ipAddress);
      }
    };

    setTimeout(() => {
      pc.close();
      resolve(ips.size > 0 ? Array.from(ips)[0] : 'No disponible');
    }, 3000);
  });
}

/**
 * Detectar navegador
 */
function detectBrowser(): string {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Edge') > -1) return 'Edge';
  if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
  
  return 'Desconocido';
}

/**
 * Detectar sistema operativo
 */
function detectOS(): string {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Win') > -1) return 'Windows';
  if (ua.indexOf('Mac') > -1) return 'MacOS';
  if (ua.indexOf('Linux') > -1) return 'Linux';
  if (ua.indexOf('Android') > -1) return 'Android';
  if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) return 'iOS';
  
  return 'Desconocido';
}

/**
 * Detectar tipo de dispositivo
 */
function detectDevice(): string {
  const ua = navigator.userAgent;
  
  if (/mobile/i.test(ua)) return 'Móvil';
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  
  return 'Desktop';
}

/**
 * Obtener eventos de la sesión actual
 */
export function getSessionEvents(): UserEvent[] {
  return eventos;
}

/**
 * Obtener todos los eventos guardados
 */
export function getAllEvents(): UserEvent[] {
  const eventosGuardados = localStorage.getItem('susuerte_eventos') || '[]';
  return JSON.parse(eventosGuardados);
}

/**
 * Limpiar eventos de sesión
 */
export function clearSessionEvents() {
  eventos = [];
}

/**
 * Obtener sesión actual
 */
export function getCurrentSessionId(): string {
  return sessionId;
}
