/**
 * Susuerte - Panel de Administración
 * Design: Corporate Admin Dashboard
 * 
 * Funcionalidades:
 *   - Autenticación con contraseña
 *   - Estadísticas: Total registros, total clics, IPs únicas
 *   - Tabla de registros de usuarios (nombre, email, IP, user agent, timestamp)
 *   - Tabla de registro de clics (nombre, email, IP, target, timestamp)
 *   - Conteos de clics por usuario
 *   - Exportación de datos a CSV para cada tabla
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Eye, EyeOff, Download } from "lucide-react";

interface RegistroUsuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  verificado: boolean;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

interface RegistroClick {
  id: string;
  nombre: string;
  email: string;
  ip: string;
  target: string;
  timestamp: string;
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [registrosUsuarios, setRegistrosUsuarios] = useState<RegistroUsuario[]>([]);
  const [registrosClics, setRegistrosClics] = useState<RegistroClick[]>([]);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  // Cargar registros del localStorage
  useEffect(() => {
    const registrosGuardados = localStorage.getItem("susuerte_registros");
    if (registrosGuardados) {
      setRegistrosUsuarios(JSON.parse(registrosGuardados));
    }

    const clicsGuardados = localStorage.getItem("susuerte_clics");
    if (clicsGuardados) {
      setRegistrosClics(JSON.parse(clicsGuardados));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (contrasena === "admin123") {
      setAutenticado(true);
      setContrasena("");
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const handleLogout = () => {
    setAutenticado(false);
    setContrasena("");
  };

  // Calcular estadísticas
  const totalRegistros = registrosUsuarios.length;
  const totalClics = registrosClics.length;
  const ipsUnicas = new Set(registrosClics.map((c) => c.ip)).size;

  // Contar clics por usuario (email)
  const conteoClicksPorUsuario = registrosClics.reduce((acc, clic) => {
    const email = clic.email;
    acc[email] = (acc[email] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Exportar CSV para registros de usuarios
  const exportarCSVUsuarios = () => {
    const headers = ["Nombre", "Email", "IP", "User Agent", "Timestamp"];
    const rows = registrosUsuarios.map((reg) => [
      reg.nombre,
      reg.email,
      reg.ip || "-",
      reg.userAgent || "-",
      reg.timestamp,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `susuerte_usuarios_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
  };

  // Exportar CSV para registro de clics
  const exportarCSVClics = () => {
    const headers = ["Nombre", "Email", "IP", "Target", "Timestamp"];
    const rows = registrosClics.map((clic) => [
      clic.nombre,
      clic.email,
      clic.ip,
      clic.target,
      clic.timestamp,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `susuerte_clics_${new Date().toISOString().split("T")[0]}.csv`);
    link.click();
  };

  if (!autenticado) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: "linear-gradient(135deg, #1a3fa0 0%, #1e4db7 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
        >
          <h1
            className="text-2xl font-bold text-gray-800 mb-2"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Panel Admin
          </h1>
          <p
            className="text-gray-500 text-sm mb-6"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Acceso restringido
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa la contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 pr-10 text-sm text-gray-800 outline-none transition-all"
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
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {mostrarContrasena ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-bold text-white transition-all"
              style={{
                fontFamily: "'Nunito', sans-serif",
                background: "#1a3fa0",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1e4db7";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#1a3fa0";
              }}
            >
              Acceder
            </button>
          </form>

          <p
            className="text-center text-xs text-gray-400 mt-4"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Contraseña de demostración: <strong>admin123</strong>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-gray-800"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Panel de Administración
            </h1>
            <p
              className="text-sm text-gray-500"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Visualiza y verifica todos los datos capturados
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <p
              className="text-gray-500 text-sm font-semibold mb-2"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Total de Registros
            </p>
            <p
              className="text-3xl font-bold text-gray-800"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {totalRegistros}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <p
              className="text-gray-500 text-sm font-semibold mb-2"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Total de Clics
            </p>
            <p
              className="text-3xl font-bold text-blue-600"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {totalClics}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg p-6 border border-gray-200"
          >
            <p
              className="text-gray-500 text-sm font-semibold mb-2"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              IPs Únicas
            </p>
            <p
              className="text-3xl font-bold text-purple-600"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {ipsUnicas}
            </p>
          </motion.div>
        </div>

        {/* Sección: Registros de Usuarios */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2
              className="text-lg font-bold text-gray-800"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Registros de Usuarios
            </h2>
            <button
              onClick={exportarCSVUsuarios}
              disabled={registrosUsuarios.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Nombre
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    IP
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    User Agent
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrosUsuarios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  registrosUsuarios.map((registro, idx) => (
                    <motion.tr
                      key={registro.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {registro.nombre}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {registro.email}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-mono text-gray-800 bg-gray-100 rounded"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {registro.ip || "-"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-800 max-w-xs truncate"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                        title={registro.userAgent}
                      >
                        {registro.userAgent ? registro.userAgent.substring(0, 50) + "..." : "-"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {new Date(registro.timestamp).toLocaleString("es-CL")}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección: Conteo de Clics por Usuario */}
        <div className="bg-white rounded-lg border border-gray-200 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2
              className="text-lg font-bold text-gray-800"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Conteo de Clics por Usuario
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Total de Clics
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(conteoClicksPorUsuario).length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-8 text-center text-gray-500"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      No hay clics registrados
                    </td>
                  </tr>
                ) : (
                  Object.entries(conteoClicksPorUsuario).map(([email, count], idx) => (
                    <motion.tr
                      key={email}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {email}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-bold text-blue-600"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {count}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sección: Registro de Clics */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2
              className="text-lg font-bold text-gray-800"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Registro de Clics
            </h2>
            <button
              onClick={exportarCSVClics}
              disabled={registrosClics.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Nombre
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    IP
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Target
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrosClics.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      No hay registros de clics
                    </td>
                  </tr>
                ) : (
                  registrosClics.map((clic, idx) => (
                    <motion.tr
                      key={clic.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {clic.nombre}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {clic.email}
                      </td>
                      <td
                        className="px-6 py-4 text-sm font-mono text-gray-800 bg-gray-100 rounded"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {clic.ip}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-800 font-semibold"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {clic.target}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {new Date(clic.timestamp).toLocaleString("es-CL")}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
