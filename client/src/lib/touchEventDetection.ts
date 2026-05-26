/**
 * Sistema Mejorado de Detección de Eventos Táctiles y Dispositivos
 * Optimizado para iOS/Safari, Android Chrome, y navegadores de escritorio
 * 
 * PROBLEMA IDENTIFICADO:
 * - Safari iOS no dispara eventos 'click' en inputs táctiles sin listeners específicos
 * - Los pointer events no se capturan correctamente en algunos casos
 * - La detección de dispositivo basada solo en UA falla con dispositivos híbridos
 * - Los passive listeners pueden perder eventos en iOS
 * 
 * SOLUCIÓN:
 * - Combinar múltiples métodos de detección (UA, touch points, screen size, capacidades)
 * - Implementar fallback chain: touch → pointer → click
 * - Agregar logging de depuración para diagnóstico
 * - Usar listeners no-passive para eventos críticos
 */

export interface TouchEventData {
  eventType: 'touch' | 'pointer' | 'click';
  targetElement: string;
  timestamp: string;
  x: number;
  y: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  os: string;
  touchPoints?: number;
  isMultiTouch: boolean;
  isSafariIOS: boolean;
}

export interface EnhancedDeviceDetection {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  os: string;
  browser: string;
  isSafariIOS: boolean;
  isAndroid: boolean;
  isTouchCapable: boolean;
  maxTouchPoints: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  userAgent: string;
  confidence: 'high' | 'medium' | 'low';
  debugInfo: string;
}

/**
 * Detectar dispositivo con múltiples métodos para máxima precisión
 */
export function detectDeviceEnhanced(): EnhancedDeviceDetection {
  const ua = navigator.userAgent;
  const platform = navigator.platform;
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;

  // Detectar iOS/Safari específicamente
  const isSafariIOS = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|mercury/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isIPad = /iPad/.test(ua);
  const isIPhone = /iPhone|iPod/.test(ua);

  // Detectar navegador
  let browser = 'Unknown';
  if (isSafariIOS) browser = 'Safari iOS';
  else if (/Chrome/.test(ua) && !isSafariIOS) browser = 'Chrome';
  else if (/Firefox/.test(ua)) browser = 'Firefox';
  else if (/Edge|Edg/.test(ua)) browser = 'Edge';
  else if (/Safari/.test(ua)) browser = 'Safari';

  // Detectar SO
  let os = 'Unknown';
  if (isIPhone) os = 'iOS';
  else if (isIPad) os = 'iPadOS';
  else if (isAndroid) os = 'Android';
  else if (/Windows/.test(ua)) os = 'Windows';
  else if (/Macintosh/.test(ua)) os = 'macOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  // Detectar capacidad táctil
  const isTouchCapable =
    'ontouchstart' in window ||
    maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0 ||
    matchMedia('(hover: none)').matches;

  // Detectar tipo de dispositivo con múltiples criterios
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let confidence: 'high' | 'medium' | 'low' = 'low';

  // Criterio 1: Basado en User-Agent
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    deviceType = 'mobile';
    confidence = 'high';
  } else if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
    confidence = 'high';
  }

  // Criterio 2: Basado en tamaño de pantalla (refinamiento)
  const screenDiagonal = Math.sqrt(screenWidth ** 2 + screenHeight ** 2) / devicePixelRatio;
  if (screenDiagonal < 600) {
    // Pantalla pequeña = móvil
    if (deviceType !== 'tablet') {
      deviceType = 'mobile';
      confidence = 'high';
    }
  } else if (screenDiagonal >= 600 && screenDiagonal < 1000) {
    // Pantalla mediana = tablet
    deviceType = 'tablet';
    confidence = 'high';
  } else if (screenDiagonal >= 1000) {
    // Pantalla grande = desktop
    deviceType = 'desktop';
    confidence = 'high';
  }

  // Criterio 3: Basado en touch points
  if (maxTouchPoints > 0 && !isTouchCapable) {
    // Dispositivo con touch pero sin soporte táctil detectado = inconsistencia
    confidence = 'medium';
  }

  // Criterio 4: Basado en capacidad de hover
  const canHover = matchMedia('(hover: hover)').matches;
  if (!canHover && deviceType === 'desktop') {
    // Desktop sin hover = probablemente tablet
    deviceType = 'tablet';
    confidence = 'medium';
  }

  const debugInfo = `[Device Detection] UA: ${ua.substring(0, 50)}... | Touch: ${isTouchCapable} | MaxTP: ${maxTouchPoints} | Screen: ${screenWidth}x${screenHeight} | Diagonal: ${screenDiagonal.toFixed(0)}px | Type: ${deviceType}`;

  // Log de depuración
  console.debug('[SUSUERTE] Device Detection:', {
    deviceType,
    os,
    browser,
    isSafariIOS,
    isAndroid,
    isTouchCapable,
    maxTouchPoints,
    screenWidth,
    screenHeight,
    devicePixelRatio,
    confidence,
  });

  return {
    deviceType,
    os,
    browser,
    isSafariIOS,
    isAndroid,
    isTouchCapable,
    maxTouchPoints,
    screenWidth,
    screenHeight,
    devicePixelRatio,
    userAgent: ua,
    confidence,
    debugInfo,
  };
}

/**
 * Registrar evento táctil con fallback chain
 */
export function createTouchEventListener(
  element: HTMLElement,
  callback: (data: TouchEventData) => void,
  fieldName: string
) {
  const deviceInfo = detectDeviceEnhanced();

  // Función auxiliar para crear datos de evento
  const createEventData = (
    eventType: 'touch' | 'pointer' | 'click',
    event: Event,
    x: number,
    y: number
  ): TouchEventData => {
    const isMultiTouch =
      (event instanceof TouchEvent && event.touches.length > 1) ||
      (event instanceof PointerEvent && event.isPrimary === false);

    return {
      eventType,
      targetElement: fieldName,
      timestamp: new Date().toISOString(),
      x,
      y,
      deviceType: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      touchPoints: (event instanceof TouchEvent) ? event.touches.length : undefined,
      isMultiTouch,
      isSafariIOS: deviceInfo.isSafariIOS,
    };
  };

  // Listener 1: Touch events (máxima prioridad para iOS)
  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      const data = createEventData('touch', event, touch.clientX, touch.clientY);
      console.debug('[SUSUERTE] Touch event captured:', { field: fieldName, ...data });
      callback(data);
    }
  };

  // Listener 2: Pointer events (fallback para navegadores modernos)
  const handlePointerDown = (event: PointerEvent) => {
    // Solo capturar si no es mouse (evitar duplicación)
    if (event.pointerType !== 'mouse') {
      const data = createEventData('pointer', event, event.clientX, event.clientY);
      console.debug('[SUSUERTE] Pointer event captured:', { field: fieldName, ...data });
      callback(data);
    }
  };

  // Listener 3: Click events (fallback final)
  const handleClick = (event: MouseEvent) => {
    // Solo capturar si el dispositivo soporta touch (para evitar duplicación en desktop)
    if (deviceInfo.isTouchCapable) {
      const data = createEventData('click', event, event.clientX, event.clientY);
      console.debug('[SUSUERTE] Click event captured (touch device):', { field: fieldName, ...data });
      callback(data);
    }
  };

  // Registrar listeners con configuración específica
  // NO usar passive: true para eventos críticos en iOS
  element.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
  element.addEventListener('pointerdown', handlePointerDown, { passive: false, capture: true });
  element.addEventListener('click', handleClick, { passive: true, capture: false });

  // Retornar función para limpiar listeners
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('pointerdown', handlePointerDown);
    element.removeEventListener('click', handleClick);
  };
}

/**
 * Monitorear eventos de formulario completo
 */
export function setupFormTouchTracking(
  formElement: HTMLElement,
  callback: (data: TouchEventData) => void
) {
  const inputs = formElement.querySelectorAll('input, button, textarea, select');
  const cleanupFunctions: Array<() => void> = [];

  inputs.forEach((input) => {
    const fieldName = (input as HTMLInputElement).id || (input as HTMLInputElement).name || 'unknown';
    const cleanup = createTouchEventListener(input as HTMLElement, callback, fieldName);
    cleanupFunctions.push(cleanup);
  });

  // Retornar función para limpiar todos los listeners
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}

/**
 * Obtener información de depuración para consola
 */
export function getDebugInfo(): string {
  const device = detectDeviceEnhanced();
  return `
=== SUSUERTE DEBUG INFO ===
Device Type: ${device.deviceType}
OS: ${device.os}
Browser: ${device.browser}
Safari iOS: ${device.isSafariIOS}
Touch Capable: ${device.isTouchCapable}
Max Touch Points: ${device.maxTouchPoints}
Screen: ${device.screenWidth}x${device.screenHeight}
Device Pixel Ratio: ${device.devicePixelRatio}
Confidence: ${device.confidence}
User Agent: ${device.userAgent}
========================
  `;
}
