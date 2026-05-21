/**
 * Susuerte - Dashboard Profesional de Phishing Awareness
 * Design: SOC Dashboard / Corporate Security
 * 
 * Funcionalidades:
 *   - Autenticación con contraseña
 *   - Resumen general con 9 métricas clave
 *   - Analítica de interacción avanzada
 *   - Datos técnicos detallados
 *   - Tabla de registros de formularios
 *   - Comportamiento del usuario
 *   - Gráficos y visualizaciones
 *   - Filtros y búsqueda
 *   - Exportación CSV y JSON
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, Eye, EyeOff, Download, Filter, Search, BarChart3, Users, MousePointer, TrendingUp } from "lucide-react";

interface RegistroUsuario {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  documento: string;
  verificado: boolean;
  timestamp: string;
  deviceData?: any;
  sessionMetrics?: any;
}

interface RegistroClick {
  id: string;
  nombre: string;
  email: string;
  ip: string;
  target: string;
  timestamp: string;
  deviceData?: any;
}

export default function Admin() {
  const [autenticado, setAutenticado] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [registrosUsuarios, setRegistrosUsuarios] = useState<RegistroUsuario[]>([]);
  const [registrosClics, setRegistrosClics] = useState<RegistroClick[]>([]);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [seccionActiva, setSeccionActiva] = useState("resumen");
  const [busqueda, setBusqueda] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [filtroDispositivo, setFiltroDispositivo] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

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

  // Calcular estadísticas generales
  const totalRegistros = registrosUsuarios.length;
  const totalClics = registrosClics.length;
  const ipsUnicas = new Set(registrosClics.map((c) => c.ip)).size;
  const usuariosUnicos = new Set(registrosUsuarios.map((r) => r.email)).size;
  
  // Tasa de conversión
  const usuariosQueHicieronClic = new Set(registrosClics.map((c) => c.email)).size;
  const tasaConversion = totalRegistros > 0 ? Math.round((totalRegistros / (usuariosQueHicieronClic || 1)) * 100) : 0;

  // Dispositivos
  const usuariosMobiles = registrosUsuarios.filter((r) => r.deviceData?.isMobile).length;
  const usuariosDesktop = registrosUsuarios.filter((r) => r.deviceData?.isDesktop).length;

  // Tiempo promedio en página
  const tiempoPromedio = registrosUsuarios.length > 0
    ? Math.round(
        registrosUsuarios.reduce((sum, r) => sum + (r.sessionMetrics?.pageViewTime || 0), 0) /
          registrosUsuarios.length
      )
    : 0;

  // Usuarios que abandonaron formulario
  const usuariosAbandonaron = registrosClics.length - totalRegistros;

  // Filtrar registros
  const registrosFiltrados = registrosUsuarios.filter((r) => {
    const coincideBusqueda =
      r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.email.toLowerCase().includes(busqueda.toLowerCase());
    const coincideFecha = !filtroFecha || r.timestamp.includes(filtroFecha);
    const coincideDispositivo = !filtroDispositivo || r.deviceData?.device === filtroDispositivo;
    return coincideBusqueda && coincideFecha && coincideDispositivo;
  });

  // Paginación
  const totalPaginas = Math.ceil(registrosFiltrados.length / itemsPorPagina);
  const registrosPaginados = registrosFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  // Exportar CSV
  const exportarCSV = (datos: any[], nombre: string) => {
    const headers = Object.keys(datos[0] || {});
    const csv = [
      headers.join(","),
      ...datos.map((row) =>
        headers.map((header) => {
          const valor = row[header];
          if (typeof valor === "object") return `"${JSON.stringify(valor)}"`;
          return `"${valor}"`;
        }).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombre}_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Exportar JSON
  const exportarJSON = (datos: any[], nombre: string) => {
    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombre}_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  if (!autenticado) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          background: "linear-gradient(135deg, #0d1117 0%, #0f1e3d 50%, #0d1117 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Panel Admin</h1>
          <p className="text-gray-500 mb-6">Acceso restringido</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <input
                  type={mostrarContrasena ? "text" : "password"}
                  placeholder="Ingresa la contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {mostrarContrasena ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Acceder
            </motion.button>
          </form>

          <p className="text-xs text-gray-400 mt-4 text-center">
            Contraseña de demostración: <strong>admin123</strong>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          {sidebarOpen && <h2 className="font-bold text-lg">Dashboard</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            ☰
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: "resumen", label: "Resumen", icon: "📊" },
            { id: "interaccion", label: "Interacción", icon: "🖱️" },
            { id: "tecnico", label: "Datos Técnicos", icon: "⚙️" },
            { id: "formularios", label: "Formularios", icon: "📋" },
            { id: "comportamiento", label: "Comportamiento", icon: "📈" },
            { id: "graficos", label: "Gráficos", icon: "📉" },
          ].map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                setSeccionActiva(item.id);
                setPaginaActual(1);
              }}
              whileTap={{ scale: 0.95 }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                seccionActiva === item.id
                  ? "bg-blue-600 text-white"
                  : "hover:bg-gray-700 text-gray-300"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <motion.button
            onClick={handleLogout}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-semibold"
          >
            <LogOut size={18} />
            {sidebarOpen && "Cerrar Sesión"}
          </motion.button>
        </div>
      </motion.div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">Panel de Administración</h1>
              <p className="text-gray-400">Visualiza y verifica todos los datos capturados</p>
            </div>
            <motion.button
              onClick={handleLogout}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </motion.button>
          </div>

          {/* SECCIÓN: RESUMEN GENERAL */}
          {seccionActiva === "resumen" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Resumen General</h2>

              {/* Cards de Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Total de Clics", valor: totalClics, color: "bg-blue-600", icon: "🖱️" },
                  { label: "Total de Registros", valor: totalRegistros, color: "bg-green-600", icon: "📝" },
                  { label: "IPs Únicas", valor: ipsUnicas, color: "bg-purple-600", icon: "🌐" },
                  { label: "Usuarios Únicos", valor: usuariosUnicos, color: "bg-indigo-600", icon: "👥" },
                  { label: "Tasa de Conversión", valor: `${tasaConversion}%`, color: "bg-orange-600", icon: "📊" },
                  { label: "Usuarios Móviles", valor: usuariosMobiles, color: "bg-pink-600", icon: "📱" },
                  { label: "Usuarios Desktop", valor: usuariosDesktop, color: "bg-cyan-600", icon: "🖥️" },
                  { label: "Tiempo Promedio (s)", valor: tiempoPromedio, color: "bg-yellow-600", icon: "⏱️" },
                  { label: "Abandonaron", valor: usuariosAbandonaron, color: "bg-red-600", icon: "❌" },
                ].map((stat, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.05 }}
                    className={`${stat.color} rounded-lg p-6 text-white shadow-lg`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90">{stat.label}</p>
                        <p className="text-3xl font-bold mt-2">{stat.valor}</p>
                      </div>
                      <span className="text-4xl">{stat.icon}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* SECCIÓN: ANALÍTICA DE INTERACCIÓN */}
          {seccionActiva === "interaccion" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Analítica de Interacción</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Conteo de Clics por Usuario */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MousePointer size={20} /> Conteo de Clics por Usuario
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {Object.entries(
                      registrosClics.reduce((acc, clic) => {
                        const email = clic.email;
                        acc[email] = (acc[email] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([email, count]) => (
                        <div key={email} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                          <span className="text-sm">{email}</span>
                          <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Usuarios por Estado */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} /> Usuarios por Estado
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <span className="text-sm">Solo Clic</span>
                      <span className="bg-yellow-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {usuariosQueHicieronClic - totalRegistros}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <span className="text-sm">Formulario Completado</span>
                      <span className="bg-green-600 px-3 py-1 rounded-full text-sm font-semibold">{totalRegistros}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <span className="text-sm">Usuarios Únicos</span>
                      <span className="bg-blue-600 px-3 py-1 rounded-full text-sm font-semibold">{usuariosUnicos}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECCIÓN: DATOS TÉCNICOS */}
          {seccionActiva === "tecnico" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold mb-4">Datos Técnicos</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Navegadores Más Usados */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Navegadores Más Usados</h3>
                  <div className="space-y-2">
                    {Object.entries(
                      registrosUsuarios.reduce((acc, r) => {
                        const browser = r.deviceData?.browser || "Desconocido";
                        acc[browser] = (acc[browser] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([browser, count]) => (
                        <div key={browser} className="flex items-center justify-between">
                          <span className="text-sm">{browser}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / totalRegistros) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sistemas Operativos */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Sistemas Operativos</h3>
                  <div className="space-y-2">
                    {Object.entries(
                      registrosUsuarios.reduce((acc, r) => {
                        const os = r.deviceData?.os || "Desconocido";
                        acc[os] = (acc[os] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([os, count]) => (
                        <div key={os} className="flex items-center justify-between">
                          <span className="text-sm">{os}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${(count / totalRegistros) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Dispositivos */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Tipos de Dispositivos</h3>
                  <div className="space-y-2">
                    {Object.entries(
                      registrosUsuarios.reduce((acc, r) => {
                        const device = r.deviceData?.device || "Desconocido";
                        acc[device] = (acc[device] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .map(([device, count]) => (
                        <div key={device} className="flex items-center justify-between">
                          <span className="text-sm">{device}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-purple-500 h-2 rounded-full"
                                style={{ width: `${(count / totalRegistros) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Resoluciones de Pantalla */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold mb-4">Resoluciones de Pantalla</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(
                      registrosUsuarios.reduce((acc, r) => {
                        const res = r.deviceData?.screenResolution || "Desconocida";
                        acc[res] = (acc[res] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    )
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([res, count]) => (
                        <div key={res} className="flex items-center justify-between text-sm">
                          <span>{res}</span>
                          <span className="bg-gray-700 px-2 py-1 rounded">{count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECCIÓN: FORMULARIOS */}
          {seccionActiva === "formularios" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Registros de Formularios</h2>
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => exportarCSV(registrosFiltrados, "registros")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <Download size={18} />
                    Exportar CSV
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => exportarJSON(registrosFiltrados, "registros")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Download size={18} />
                    Exportar JSON
                  </motion.button>
                </div>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div>
                  <label className="block text-sm font-semibold mb-2">Buscar</label>
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Nombre, email..."
                      value={busqueda}
                      onChange={(e) => {
                        setBusqueda(e.target.value);
                        setPaginaActual(1);
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 pl-10 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Fecha</label>
                  <input
                    type="date"
                    value={filtroFecha}
                    onChange={(e) => {
                      setFiltroFecha(e.target.value);
                      setPaginaActual(1);
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Dispositivo</label>
                  <select
                    value={filtroDispositivo}
                    onChange={(e) => {
                      setFiltroDispositivo(e.target.value);
                      setPaginaActual(1);
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="">Todos</option>
                    <option value="Móvil">Móvil</option>
                    <option value="Desktop">Desktop</option>
                    <option value="Tablet">Tablet</option>
                  </select>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-700 border-b border-gray-600">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                        <th className="px-6 py-3 text-left font-semibold">Email</th>
                        <th className="px-6 py-3 text-left font-semibold">IP Pública</th>
                        <th className="px-6 py-3 text-left font-semibold">Navegador</th>
                        <th className="px-6 py-3 text-left font-semibold">Dispositivo</th>
                        <th className="px-6 py-3 text-left font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {registrosPaginados.map((reg) => (
                        <tr key={reg.id} className="hover:bg-gray-700 transition-colors">
                          <td className="px-6 py-3">{reg.nombre}</td>
                          <td className="px-6 py-3 text-blue-400">{reg.email}</td>
                          <td className="px-6 py-3 font-mono text-xs">{reg.deviceData?.publicIP || "-"}</td>
                          <td className="px-6 py-3">{reg.deviceData?.browser || "-"}</td>
                          <td className="px-6 py-3">{reg.deviceData?.device || "-"}</td>
                          <td className="px-6 py-3 text-xs text-gray-400">
                            {new Date(reg.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginación */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                  <span className="text-sm text-gray-400">
                    Mostrando {(paginaActual - 1) * itemsPorPagina + 1} a{" "}
                    {Math.min(paginaActual * itemsPorPagina, registrosFiltrados.length)} de{" "}
                    {registrosFiltrados.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                      disabled={paginaActual === 1}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-sm">
                      {paginaActual} / {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded-lg transition-colors"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* SECCIONES PLACEHOLDER */}
          {["comportamiento", "graficos"].includes(seccionActiva) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <BarChart3 size={48} className="mx-auto mb-4 text-gray-500" />
              <h2 className="text-2xl font-bold mb-2">
                {seccionActiva === "comportamiento" ? "Comportamiento del Usuario" : "Gráficos y Visualizaciones"}
              </h2>
              <p className="text-gray-400">Esta sección está en desarrollo</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
