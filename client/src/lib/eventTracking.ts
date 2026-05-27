/**
 * Sistema de Eventos Detallados para Phishing Awareness
 * Registra todos los eventos del usuario con trazabilidad completa
 */

// Importar trpc para guardar en BD
let trpcClient: any = null;

export function setTrpcClient(client: any) {
  trpcClient = client;
}

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

  // Guardar en BD si trpcClient está disponible
  if (trpcClient) {
    try {
      await trpcClient.susuert.createEvent.mutate({
        sessionId: evento.sessionId,
        eventType: evento.eventType,
        timestamp: evento.timestamp,
        ipPublica: evento.ipPublica,
        ipPrivada: evento.ipPrivada,
        userAgent: evento.userAgent,
        navegador: evento.navegador,
        sistemaOperativo: evento.sistemaOperativo,
        dispositivo: evento.dispositivo,
        tiempoActivo: evento.tiempoActivo,
        paginaVisitada: evento.paginaVisitada,
        detalles: evento.detalles,
      }).catch((err: any) => console.error('Error saving event to DB:', err));
    } catch (error) {
      console.error('Error saving event to DB:', error);
    }
  }

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
    try {
      const pc = new (window as any).RTCPeerConnection({ iceServers: [] });
      const ips: Set<string> = new Set();

      pc.createDataChannel('');
      pc.createOffer().then((offer: any) => {
        pc.setLocalDescription(offer);
      }).catch(() => {
        pc.close();
        resolve('No disponible');
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
    } catch (error) {
      resolve('No disponible');
    }
  });
}

/**
 * Detectar navegador
 */
function detectBrowser(): string {
  const ua = navigator.userAgent;
  
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('CriOS') === -1) return 'Chrome';
  if (ua.indexOf('CriOS') > -1) return 'Chrome iOS';
  if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1 && ua.indexOf('CriOS') === -1) {
    if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1 || ua.indexOf('iPod') > -1) {
      return 'Safari iOS';
    }
    return 'Safari';
  }
  if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) return 'Edge';
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
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isTouchCapable = 'ontouchstart' in window || maxTouchPoints > 0 || (navigator as any).msMaxTouchPoints > 0;
  
  let tipo = 'Desktop';
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    tipo = 'Móvil';
  } else if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
    tipo = 'Tablet';
  }
  
  const screenDiagonal = Math.sqrt(screenWidth ** 2 + screenHeight ** 2) / devicePixelRatio;
  if (screenDiagonal < 600 && tipo !== 'Tablet') {
    tipo = 'Móvil';
  } else if (screenDiagonal >= 600 && screenDiagonal < 1000) {
    tipo = 'Tablet';
  } else if (screenDiagonal >= 1000) {
    tipo = 'Desktop';
  }
  
  if (isTouchCapable && tipo === 'Desktop' && screenDiagonal < 1000) {
    tipo = 'Tablet';
  }
  
  return tipo;
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
