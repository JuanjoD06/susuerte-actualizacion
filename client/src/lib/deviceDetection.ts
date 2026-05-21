/**
 * Device Detection & Technical Data Capture
 * Captura avanzada de datos técnicos del usuario para análisis de phishing awareness
 */

export interface DeviceData {
  publicIP: string;
  privateIP: string;
  userAgent: string;
  browser: string;
  os: string;
  device: string;
  screenResolution: string;
  language: string;
  timezone: string;
  referer: string;
  platform: string;
  isp?: string;
  city?: string;
  country?: string;
  isMobile: boolean;
  isDesktop: boolean;
  timestamp: string;
}

export interface SessionMetrics {
  sessionStart: number;
  pageViewTime: number;
  scrollDepth: number;
  focusEvents: number;
  blurEvents: number;
  copyPasteEvents: number;
  abandonmentTime?: number;
  formInteractions: number;
  clickCount: number;
  keyPressCount: number;
  isFormAbandoned: boolean;
  formCompletionPercentage: number;
}

// Detectar navegador
function detectBrowser(userAgent: string): string {
  if (userAgent.includes("Chrome") && !userAgent.includes("Chromium")) return "Chrome";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edge")) return "Edge";
  if (userAgent.includes("Opera") || userAgent.includes("OPR")) return "Opera";
  if (userAgent.includes("Trident")) return "Internet Explorer";
  return "Desconocido";
}

// Detectar SO
function detectOS(userAgent: string): string {
  if (userAgent.includes("Windows")) return "Windows";
  if (userAgent.includes("Mac")) return "macOS";
  if (userAgent.includes("Linux")) return "Linux";
  if (userAgent.includes("Android")) return "Android";
  if (userAgent.includes("iPhone") || userAgent.includes("iPad")) return "iOS";
  return "Desconocido";
}

// Detectar tipo de dispositivo
function detectDevice(userAgent: string): string {
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())) {
    return "Móvil";
  }
  if (/ipad|tablet|playbook|silk/i.test(userAgent.toLowerCase())) {
    return "Tablet";
  }
  return "Desktop";
}

// Obtener IP privada usando WebRTC
async function getPrivateIP(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new (window as any).RTCPeerConnection({
        iceServers: [],
      });

      pc.createDataChannel("");
      pc.createOffer().then((offer: any) => {
        pc.setLocalDescription(offer);
      });

      pc.onicecandidate = (ice: any) => {
        if (!ice || !ice.candidate) return;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
        const ipAddress = ipRegex.exec(ice.candidate.candidate);
        if (ipAddress) {
          resolve(ipAddress[1]);
          pc.close();
        }
      };

      setTimeout(() => {
        pc.close();
        resolve("No disponible");
      }, 3000);
    } catch (error) {
      resolve("No disponible");
    }
  });
}

// Obtener IP pública
export async function getPublicIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "Desconocida";
  } catch (error) {
    console.error("Error obteniendo IP pública:", error);
    return "Desconocida";
  }
}

// Obtener información de geolocalización basada en IP
export async function getGeoLocation(ip: string): Promise<{ city?: string; country?: string }> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    const data = await response.json();
    return {
      city: data.city || "Desconocida",
      country: data.country_name || "Desconocida",
    };
  } catch (error) {
    console.error("Error obteniendo geolocalización:", error);
    return { city: "Desconocida", country: "Desconocida" };
  }
}

// Capturar todos los datos técnicos del dispositivo
export async function captureDeviceData(): Promise<DeviceData> {
  const userAgent = navigator.userAgent;
  const publicIP = await getPublicIP();
  const privateIP = await getPrivateIP();
  const geo = await getGeoLocation(publicIP);

  return {
    publicIP,
    privateIP,
    userAgent,
    browser: detectBrowser(userAgent),
    os: detectOS(userAgent),
    device: detectDevice(userAgent),
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language || "Desconocido",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    referer: document.referrer || "Directo",
    platform: navigator.platform || "Desconocido",
    city: geo.city,
    country: geo.country,
    isMobile: /mobile|android|iphone|ipod/i.test(userAgent.toLowerCase()),
    isDesktop: !/mobile|android|iphone|ipod|tablet/i.test(userAgent.toLowerCase()),
    timestamp: new Date().toISOString(),
  };
}

// Inicializar tracking de métricas de sesión
export function initializeSessionMetrics(): SessionMetrics {
  return {
    sessionStart: Date.now(),
    pageViewTime: 0,
    scrollDepth: 0,
    focusEvents: 0,
    blurEvents: 0,
    copyPasteEvents: 0,
    formInteractions: 0,
    clickCount: 0,
    keyPressCount: 0,
    isFormAbandoned: false,
    formCompletionPercentage: 0,
  };
}

// Calcular scroll depth
export function calculateScrollDepth(): number {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.scrollY;
  return Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
}

// Calcular tiempo en página
export function calculatePageViewTime(startTime: number): number {
  return Math.round((Date.now() - startTime) / 1000); // en segundos
}
