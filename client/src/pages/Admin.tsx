/**
 * Susuerte - Panel de Administración
 * Design: Corporate Admin Dashboard
 * 
 * Funcionalidades:
 *   - Autenticación con contraseña
 *   - Tabla de registros de colaboradores
 *   - Filtrado por correo electrónico
 *   - Botón de verificación para cada registro
 *   - Exportación de datos a CSV
 *   - Estadísticas generales
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Eye, EyeOff, Download, Check, X } from "lucide-react";

interface Registro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  verificado: boolean;
  timestamp: string;
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [filtro, setFiltro] = useState("");
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  // Cargar registros del localStorage
  useEffect(() => {
    const registrosGuardados = localStorage.getItem("susuerte_registros");
    if (registrosGuardados) {
      setRegistros(JSON.parse(registrosGuardados));
    }
  }, []);

  // Guardar registros en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("susuerte_registros", JSON.stringify(registros));
  }, [registros]);

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

  const registrosFiltrados = registros.filter((reg) =>
    reg.email.toLowerCase().includes(filtro.toLowerCase())
  );

  const toggleVerificado = (id: string) => {
    setRegistros(
      registros.map((reg) =>
        reg.id === id ? { ...reg, verificado: !reg.verificado } : reg
      )
    );
  };

  const exportarCSV = () => {
    const headers = ["Nombre", "Email", "Teléfono", "Documento", "Verificado", "Fecha"];
    const rows = registrosFiltrados.map((reg) => [
      reg.nombre,
      reg.email,
      reg.telefono,
      reg.documento,
      reg.verificado ? "Sí" : "No",
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
    link.setAttribute("download", `susuerte_registros_${new Date().toISOString().split("T")[0]}.csv`);
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
              {registros.length}
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
              Verificados
            </p>
            <p
              className="text-3xl font-bold text-green-600"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {registros.filter((r) => r.verificado).length}
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
              Pendientes
            </p>
            <p
              className="text-3xl font-bold text-yellow-600"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {registros.filter((r) => !r.verificado).length}
            </p>
          </motion.div>
        </div>

        {/* Filtro y Exportar */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label
                className="block text-sm font-semibold text-gray-700 mb-2"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                Filtrar por correo electrónico
              </label>
              <input
                type="text"
                placeholder="Buscar por email..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none transition-all"
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
            <button
              onClick={exportarCSV}
              disabled={registrosFiltrados.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Tabla de Registros */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    Teléfono
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Documento
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Verificado
                  </th>
                  <th
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                    style={{ fontFamily: "'Nunito', sans-serif" }}
                  >
                    Fecha
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  registrosFiltrados.map((registro, idx) => (
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
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {registro.telefono || "-"}
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-800"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {registro.documento || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleVerificado(registro.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
                            registro.verificado
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          style={{ fontFamily: "'Nunito', sans-serif" }}
                        >
                          {registro.verificado ? (
                            <>
                              <Check size={16} />
                              Verificado
                            </>
                          ) : (
                            <>
                              <X size={16} />
                              Pendiente
                            </>
                          )}
                        </button>
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-600"
                        style={{ fontFamily: "'Nunito', sans-serif" }}
                      >
                        {new Date(registro.timestamp).toLocaleDateString("es-ES")}
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
