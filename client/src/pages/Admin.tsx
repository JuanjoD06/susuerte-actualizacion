/**
 * Panel Administrativo - Dashboard SOC de Phishing Awareness
 * Análisis completo de campañas, eventos, usuarios y métricas
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc';

interface RegistroUsuario {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  documento: string;
  verificado: 'pendiente' | 'verificado' | 'rechazado';
  timestamp: string;
  deviceData?: any;
  sessionId?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserEvent {
  id: string;
  sessionId: string;
  eventType: string;
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

type TabType = 'dashboard' | 'usuarios' | 'eventos' | 'estadisticas' | 'exportar' | 'logs' | 'configuracion';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [registros, setRegistros] = useState<RegistroUsuario[]>([]);
  const [eventos, setEventos] = useState<UserEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDevice, setFilterDevice] = useState('');
  const [filterBrowser, setFilterBrowser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Queries de tRPC
  const getAllRegistrosQuery = trpc.susuert.getAllRegistros.useQuery(undefined, {
    enabled: authenticated,
  });

  // Cargar datos al montar y cuando se autentica
  useEffect(() => {
    if (authenticated && getAllRegistrosQuery.data) {
      const registrosFromBD = getAllRegistrosQuery.data.map((r: any) => ({
        id: r.id,
        nombre: r.nombre,
        email: r.email,
        telefono: r.telefono,
        documento: r.documento,
        verificado: r.verificado,
        timestamp: r.createdAt || new Date().toISOString(),
        deviceType: r.deviceType,
        browser: r.browser,
        os: r.os,
        sessionId: r.sessionId,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
      setRegistros(registrosFromBD);
    }
  }, [authenticated, getAllRegistrosQuery.data]);

  // Auto-refresh cada 5 segundos
  useEffect(() => {
    if (!authenticated) return;

    const interval = setInterval(() => {
      getAllRegistrosQuery.refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [authenticated, getAllRegistrosQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setAuthenticated(true);
      setUsername('');
      setPassword('');
      // Cargar datos de la BD
      getAllRegistrosQuery.refetch();
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setUsername('');
    setPassword('');
  };

  const updateRegistroMutation = trpc.susuert.updateRegistro.useMutation();

  const toggleVerificacion = (id: number) => {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;

    // Cambiar estado: pendiente -> verificado -> rechazado -> pendiente
    let nuevoEstado: 'pendiente' | 'verificado' | 'rechazado' = 'pendiente';
    if (registro.verificado === 'pendiente') nuevoEstado = 'verificado';
    else if (registro.verificado === 'verificado') nuevoEstado = 'rechazado';

    updateRegistroMutation.mutate(
      { id, verificado: nuevoEstado },
      {
        onSuccess: () => {
          // Actualizar estado local
          const nuevosRegistros = registros.map(r =>
            r.id === id ? { ...r, verificado: nuevoEstado } : r
          );
          setRegistros(nuevosRegistros);
        },
      }
    );
  };

  // Calcular métricas
  const calcularMetricas = () => {
    console.log('[SUSUERTE ADMIN METRICS] Total eventos:', eventos.length);
    const totalClics = eventos.filter(e => e.eventType === 'BUTTON_CLICK').length;
    const totalRegistros = registros.length;
    const usuariosUnicos = new Set(eventos.map(e => e.email)).size;
    const ipsUnicas = new Set(eventos.map(e => e.ipPublica)).size;
    const usuariosVulnerables = registros.length;
    const usuariosSospechosos = eventos
      .filter(e => e.eventType === 'FORM_ABANDON')
      .map(e => e.email)
      .filter((v, i, a) => a.indexOf(v) === i).length;

    const conversionPhishing = totalClics > 0 
      ? ((totalRegistros / totalClics) * 100).toFixed(2) 
      : '0.00';

    const tiempoPromedioPermanencia = eventos.length > 0
      ? ((eventos.reduce((sum, e) => sum + e.tiempoActivo, 0) / eventos.length) / 1000).toFixed(1)
      : '0';

    const navegadores = eventos.reduce((acc, e) => {
      acc[e.navegador] = (acc[e.navegador] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const navegadorMasUsado = Object.entries(navegadores).length > 0
      ? Object.entries(navegadores).sort((a, b) => b[1] - a[1])[0][0]
      : 'Desconocido';

    const sistemaOperativos = eventos.reduce((acc, e) => {
      acc[e.sistemaOperativo] = (acc[e.sistemaOperativo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sistemaOperativoMasUsado = Object.entries(sistemaOperativos).length > 0
      ? Object.entries(sistemaOperativos).sort((a, b) => b[1] - a[1])[0][0]
      : 'Desconocido';

    const usuariosMobiles = eventos.filter(e => e.dispositivo === 'Móvil').length;
    const usuariosDesktop = eventos.filter(e => e.dispositivo === 'Desktop').length;

    return {
      totalClics,
      totalRegistros,
      usuariosUnicos,
      ipsUnicas,
      usuariosVulnerables,
      usuariosSospechosos,
      conversionPhishing,
      tiempoPromedioPermanencia: `${tiempoPromedioPermanencia}s`,
      navegadorMasUsado,
      sistemaOperativoMasUsado,
      usuariosMobiles,
      usuariosDesktop,
    };
  };

  const metricas = calcularMetricas();

  // Exportar CSV
  const exportarCSV = (datos: any[], nombre: string) => {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = Object.keys(datos[0]);
    const csv = [
      headers.join(','),
      ...datos.map(row =>
        headers.map(header => {
          const valor = row[header];
          if (typeof valor === 'object') return `"${JSON.stringify(valor)}"`;
          return `"${valor}"`;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Exportar JSON
  const exportarJSON = (datos: any[], nombre: string) => {
    if (datos.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const json = JSON.stringify(datos, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Filtrar datos
  const registrosFiltrados = registros.filter(r =>
    r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const eventosFiltrados = eventos.filter(e => {
    let match = true;
    if (filterDevice && filterDevice !== '') {
      if (e.dispositivo !== filterDevice) match = false;
    }
    if (filterBrowser && filterBrowser !== '') {
      if (e.navegador !== filterBrowser) match = false;
    }
    return match;
  });

  console.log('[SUSUERTE ADMIN] Total eventos:', eventos.length);
  console.log('[SUSUERTE ADMIN] Eventos filtrados:', eventosFiltrados.length);
  console.log('[SUSUERTE ADMIN] Filtro dispositivo:', filterDevice || 'NINGUNO');
  console.log('[SUSUERTE ADMIN] Filtro navegador:', filterBrowser || 'NINGUNO');

  // Paginación
  const totalPages = Math.ceil(registrosFiltrados.length / itemsPerPage);
  const paginatedRegistros = registrosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f1e3d 50%, #0d1117 100%)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-lg shadow-2xl p-8"
        >
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Panel Administrativo</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
              <input
                type="password"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••"
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Acceder
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard SOC - Phishing Awareness</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-semibold transition"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 space-y-2">
          {[
            { id: 'dashboard', label: '📊 Dashboard' },
            { id: 'usuarios', label: '👥 Usuarios' },
            { id: 'eventos', label: '📋 Eventos' },
            { id: 'estadisticas', label: '📈 Estadísticas' },
            { id: 'exportar', label: '💾 Exportar' },
            { id: 'logs', label: '📝 Logs' },
            { id: 'configuracion', label: '⚙️ Configuración' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType);
                setCurrentPage(1);
              }}
              className={`w-full text-left px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Dashboard Ejecutivo</h2>

              {/* Métricas Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total de Clics', value: metricas.totalClics, icon: '🖱️' },
                  { label: 'Total de Registros', value: metricas.totalRegistros, icon: '📝' },
                  { label: 'Usuarios Únicos', value: metricas.usuariosUnicos, icon: '👤' },
                  { label: 'IPs Únicas', value: metricas.ipsUnicas, icon: '🌐' },
                  { label: 'Usuarios Vulnerables', value: metricas.usuariosVulnerables, icon: '⚠️' },
                  { label: 'Usuarios Sospechosos', value: metricas.usuariosSospechosos, icon: '🚨' },
                  { label: 'Conversión Phishing', value: `${metricas.conversionPhishing}%`, icon: '📊' },
                  { label: 'Tiempo Promedio', value: metricas.tiempoPromedioPermanencia, icon: '⏱️' },
                  { label: 'Navegador Más Usado', value: metricas.navegadorMasUsado, icon: '🌐' },
                  { label: 'SO Más Usado', value: metricas.sistemaOperativoMasUsado, icon: '💻' },
                  { label: 'Usuarios Móviles', value: metricas.usuariosMobiles, icon: '📱' },
                  { label: 'Usuarios Desktop', value: metricas.usuariosDesktop, icon: '🖥️' },
                ].map((metric, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                  >
                    <div className="text-2xl mb-2">{metric.icon}</div>
                    <p className="text-gray-400 text-sm">{metric.label}</p>
                    <p className="text-2xl font-bold text-blue-400">{metric.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Usuarios Tab */}
          {activeTab === 'usuarios' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Registros de Usuarios</h2>

              {/* Búsqueda */}
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => exportarCSV(registrosFiltrados, 'usuarios')}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition"
                >
                  📥 CSV
                </button>
              </div>

              {/* Tabla */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Teléfono</th>
                      <th className="px-4 py-3 text-left">Documento</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                      <th className="px-4 py-3 text-left">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRegistros.map(registro => (
                      <tr key={registro.id} className="border-t border-gray-700 hover:bg-gray-750">
                        <td className="px-4 py-3">{registro.nombre}</td>
                        <td className="px-4 py-3">{registro.email}</td>
                        <td className="px-4 py-3">{registro.telefono}</td>
                        <td className="px-4 py-3">{registro.documento}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              registro.verificado === 'verificado'
                                ? 'bg-green-900 text-green-300'
                                : registro.verificado === 'rechazado'
                                ? 'bg-red-900 text-red-300'
                                : 'bg-yellow-900 text-yellow-300'
                            }`}
                          >
                            {registro.verificado === 'verificado'
                              ? '✓ Verificado'
                              : registro.verificado === 'rechazado'
                              ? '✗ Rechazado'
                              : '⏳ Pendiente'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleVerificacion(registro.id)}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm font-semibold transition"
                          >
                            {registro.verificado === 'pendiente'
                              ? 'Verificar'
                              : registro.verificado === 'verificado'
                              ? 'Rechazar'
                              : 'Pendiente'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="flex justify-between items-center">
                <p className="text-gray-400">
                  Página {currentPage} de {totalPages} ({registrosFiltrados.length} registros)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Eventos Tab */}
          {activeTab === 'eventos' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Registro de Eventos</h2>

              {/* Filtros */}
              <div className="flex gap-4 mb-4">
                <select
                  value={filterDevice}
                  onChange={(e) => {
                    setFilterDevice(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los dispositivos</option>
                  <option value="Móvil">Móvil</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Tablet">Tablet</option>
                </select>

                <select
                  value={filterBrowser}
                  onChange={(e) => {
                    setFilterBrowser(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los navegadores</option>
                  {Array.from(new Set(eventos.map(e => e.navegador))).map(nav => (
                    <option key={nav} value={nav}>{nav}</option>
                  ))}
                </select>

                <button
                  onClick={() => exportarCSV(eventosFiltrados, 'eventos')}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition"
                >
                  📥 CSV
                </button>
              </div>

              {/* Tabla de Eventos */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left">Timestamp</th>
                      <th className="px-4 py-3 text-left">Tipo</th>
                      <th className="px-4 py-3 text-left">Campo/Detalle</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">IP Pública</th>
                      <th className="px-4 py-3 text-left">Navegador</th>
                      <th className="px-4 py-3 text-left">Dispositivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventosFiltrados.slice(0, 50).map(evento => (
                      <tr key={evento.id} className="border-t border-gray-700 hover:bg-gray-750">
                        <td className="px-4 py-3 text-xs">{new Date(evento.timestamp).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            evento.eventType === 'BUTTON_CLICK' ? 'bg-yellow-900 text-yellow-300' :
                            evento.eventType === 'FORM_SUBMIT' ? 'bg-green-900 text-green-300' :
                            evento.eventType === 'FORM_START' ? 'bg-blue-900 text-blue-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {evento.eventType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {evento.detalles?.campo || evento.detalles?.tipo || 'N/A'}
                        </td>
                        <td className="px-4 py-3">{evento.email || 'N/A'}</td>
                        <td className="px-4 py-3 text-xs">{evento.ipPublica}</td>
                        <td className="px-4 py-3 text-xs">{evento.navegador}</td>
                        <td className="px-4 py-3 text-xs">{evento.dispositivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Exportar Tab */}
          {activeTab === 'exportar' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Exportar Datos</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => exportarCSV(registros, 'usuarios')}
                  className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg font-semibold transition text-lg"
                >
                  📥 Usuarios (CSV)
                </button>
                <button
                  onClick={() => exportarCSV(eventos, 'eventos')}
                  className="bg-green-600 hover:bg-green-700 px-6 py-4 rounded-lg font-semibold transition text-lg"
                >
                  📥 Eventos (CSV)
                </button>
                <button
                  onClick={() => exportarJSON(registros, 'usuarios')}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg font-semibold transition text-lg"
                >
                  📥 Usuarios (JSON)
                </button>
                <button
                  onClick={() => exportarJSON(eventos, 'eventos')}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-lg font-semibold transition text-lg"
                >
                  📥 Eventos (JSON)
                </button>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Logs del Sistema</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400">
                  Total de eventos registrados: <span className="text-blue-400 font-bold">{eventos.length}</span>
                </p>
                <p className="text-gray-400 mt-2">
                  Total de registros: <span className="text-blue-400 font-bold">{registros.length}</span>
                </p>
                <p className="text-gray-400 mt-2">
                  Última actualización: <span className="text-blue-400 font-bold">{new Date().toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}

          {/* Configuración Tab */}
          {activeTab === 'configuracion' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Configuración</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <button
                  onClick={() => {
                    if (confirm('¿Estás seguro de que deseas limpiar todos los datos?')) {
                      localStorage.removeItem('susuerte_registros');
                      localStorage.removeItem('susuerte_eventos');
                      setRegistros([]);
                      setEventos([]);
                      alert('Datos limpiados correctamente');
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
                >
                  🗑️ Limpiar Todos los Datos
                </button>
              </div>
            </div>
          )}

          {/* Clics por Campo Tab */}
          {activeTab === 'eventos' && (
            <div className="space-y-6 mt-8">
              <h3 className="text-2xl font-bold mb-4">Resumen de Clics por Campo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  eventos
                    .filter(e => e.eventType === 'BUTTON_CLICK')
                    .reduce((acc, e) => {
                      const campo = e.detalles?.campo || 'Desconocido';
                      acc[campo] = (acc[campo] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                ).map(([campo, count]) => (
                  <div key={campo} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">Campo: {campo}</p>
                    <p className="text-3xl font-bold text-yellow-400">{count}</p>
                    <p className="text-xs text-gray-500 mt-2">clics registrados</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estadísticas Tab */}
          {activeTab === 'estadisticas' && (
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-6">Análisis y Estadísticas</h2>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400">Sección de estadísticas avanzadas en construcción...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
