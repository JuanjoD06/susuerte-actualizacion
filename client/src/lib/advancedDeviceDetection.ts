/**
 * Sistema Avanzado de Detección de Dispositivos
 * Captura datos técnicos completos: IP privada/pública, IPv6, geolocalización, etc.
 */

export interface AdvancedDeviceData {
  // IPs
  ipPublica: string;
  ipPrivada: string;
  ipv6Local: string;
  
  // Navegador
  navegador: string;
  versionNavegador: string;
  
  // Sistema Operativo
  sistemaOperativo: string;
  versionOS: string;
  
  // Dispositivo
  tipoDispositivo: string;
  resolucionPantalla: string;
  
  // Información del navegador
  idioma: string;
  zonaHoraria: string;
  plataforma: string;
  referer: string;
  
  // Geolocalización aproximada
  ciudad?: string;
  pais?: string;
  isp?: string;
  
  // User Agent completo
  userAgent: string;
  
  // Información adicional
  touchSupport: boolean;
  cookiesEnabled: boolean;
  doNotTrack: string;
}

/**
 * Capturar todos los datos técnicos avanzados
 */
export async function captureAdvancedDeviceData(): Promise<AdvancedDeviceData> {
  const [ipPublica, ipPrivada, ipv6Local, geoData] = await Promise.all([
    getPublicIP(),
    getPrivateIP(),
    getIPv6Local(),
    getGeolocationData(),
  ]);

  const ua = navigator.userAgent;
  const browserInfo = parseBrowserInfo(ua);
  const osInfo = parseOSInfo(ua);
  const deviceInfo = parseDeviceInfo(ua);

  return {
    ipPublica,
    ipPrivada,
    ipv6Local,
    navegador: browserInfo.nombre,
    versionNavegador: browserInfo.version,
    sistemaOperativo: osInfo.nombre,
    versionOS: osInfo.version,
    tipoDispositivo: deviceInfo.tipo,
    resolucionPantalla: `${window.screen.width}x${window.screen.height}`,
    idioma: navigator.language || 'Desconocido',
    zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plataforma: navigator.platform || 'Desconocido',
    referer: document.referrer || 'Directo',
    ciudad: geoData.ciudad,
    pais: geoData.pais,
    isp: geoData.isp,
    userAgent: ua,
    touchSupport: () => {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    }(),
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack || 'Desconocido',
  };
}

/**
 * Obtener IP pública
 */
async function getPublicIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return data.ip || 'Desconocida';
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
      });

      pc.onicecandidate = (ice: any) => {
        if (!ice || !ice.candidate) {
          pc.close();
          resolve(ips.size > 0 ? Array.from(ips)[0] : 'No disponible');
          return;
        }

        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
        const ipAddress = ipRegex.exec(ice.candidate.candidate)?.[1];
        if (ipAddress && !ips.has(ipAddress)) {
          ips.add(ipAddress);
        }
      };

      setTimeout(() => {
        pc.close();
        resolve(ips.size > 0 ? Array.from(ips)[0] : 'No disponible');
      }, 3000);
    } catch {
      resolve('No disponible');
    }
  });
}

/**
 * Obtener IPv6 local
 */
async function getIPv6Local(): Promise<string> {
  return new Promise((resolve) => {
    try {
      const pc = new (window as any).RTCPeerConnection({ iceServers: [] });
      const ipv6Addresses: Set<string> = new Set();

      pc.createDataChannel('');
      pc.createOffer().then((offer: any) => {
        pc.setLocalDescription(offer);
      });

      pc.onicecandidate = (ice: any) => {
        if (!ice || !ice.candidate) {
          pc.close();
          resolve(ipv6Addresses.size > 0 ? Array.from(ipv6Addresses)[0] : 'No disponible');
          return;
        }

        const ipv6Regex = /([a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
        const ipv6Address = ipv6Regex.exec(ice.candidate.candidate)?.[1];
        if (ipv6Address && !ipv6Addresses.has(ipv6Address)) {
          ipv6Addresses.add(ipv6Address);
        }
      };

      setTimeout(() => {
        pc.close();
        resolve(ipv6Addresses.size > 0 ? Array.from(ipv6Addresses)[0] : 'No disponible');
      }, 3000);
    } catch {
      resolve('No disponible');
    }
  });
}

/**
 * Obtener datos de geolocalización aproximada
 */
async function getGeolocationData(): Promise<{ ciudad?: string; pais?: string; isp?: string }> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000),
    });
    const data = await response.json();
    return {
      ciudad: data.city || undefined,
      pais: data.country_name || undefined,
      isp: data.org || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Parsear información del navegador
 */
function parseBrowserInfo(ua: string): { nombre: string; version: string } {
  let nombre = 'Desconocido';
  let version = 'Desconocida';

  if (ua.indexOf('Firefox') > -1) {
    nombre = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Desconocida';
  } else if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) {
    nombre = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Desconocida';
  } else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
    nombre = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Desconocida';
  } else if (ua.indexOf('Edge') > -1) {
    nombre = 'Edge';
    version = ua.match(/Edg\/(\d+)/)?.[1] || 'Desconocida';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    nombre = 'Opera';
    version = ua.match(/OPR\/(\d+)/)?.[1] || 'Desconocida';
  }

  return { nombre, version };
}

/**
 * Parsear información del sistema operativo
 */
function parseOSInfo(ua: string): { nombre: string; version: string } {
  let nombre = 'Desconocido';
  let version = 'Desconocida';

  if (ua.indexOf('Windows') > -1) {
    nombre = 'Windows';
    if (ua.indexOf('Windows NT 10.0') > -1) version = '10/11';
    else if (ua.indexOf('Windows NT 6.3') > -1) version = '8.1';
    else if (ua.indexOf('Windows NT 6.2') > -1) version = '8';
  } else if (ua.indexOf('Mac') > -1) {
    nombre = 'macOS';
    version = ua.match(/OS X (\d+_\d+)/)?.[1]?.replace(/_/g, '.') || 'Desconocida';
  } else if (ua.indexOf('Linux') > -1) {
    nombre = 'Linux';
  } else if (ua.indexOf('Android') > -1) {
    nombre = 'Android';
    version = ua.match(/Android (\d+)/)?.[1] || 'Desconocida';
  } else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) {
    nombre = ua.indexOf('iPhone') > -1 ? 'iOS' : 'iPadOS';
    version = ua.match(/OS (\d+_\d+)/)?.[1]?.replace(/_/g, '.') || 'Desconocida';
  }

  return { nombre, version };
}

/**
 * Parsear información del dispositivo
 */
function parseDeviceInfo(ua: string): { tipo: string } {
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return { tipo: 'Móvil' };
  } else if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
    return { tipo: 'Tablet' };
  }
  return { tipo: 'Desktop' };
}

/**
 * Formatear datos técnicos para visualización
 */
export function formatAdvancedDeviceData(data: AdvancedDeviceData): Record<string, string> {
  return {
    'IP Pública': data.ipPublica,
    'IP Privada': data.ipPrivada,
    'IPv6 Local': data.ipv6Local,
    'Navegador': `${data.navegador} ${data.versionNavegador}`,
    'Sistema Operativo': `${data.sistemaOperativo} ${data.versionOS}`,
    'Tipo de Dispositivo': data.tipoDispositivo,
    'Resolución': data.resolucionPantalla,
    'Idioma': data.idioma,
    'Zona Horaria': data.zonaHoraria,
    'Plataforma': data.plataforma,
    'Referrer': data.referer,
    'Ciudad': data.ciudad || 'Desconocida',
    'País': data.pais || 'Desconocido',
    'ISP': data.isp || 'Desconocido',
    'Soporte Táctil': data.touchSupport ? 'Sí' : 'No',
    'Cookies Habilitadas': data.cookiesEnabled ? 'Sí' : 'No',
    'Do Not Track': data.doNotTrack,
  };
}
