/*
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

  const getAllEventsQuery = trpc.susuert.getAllEvents.useQuery(undefined, {
    enabled: authenticated,
  });

  // Cargar datos al montar y cuando se autentica
  useEffect(() => {
    if (authenticated) {
      // Cargar registros desde BD
      if (getAllRegistrosQuery.data) {
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

      // Cargar eventos desde BD
      if (getAllEventsQuery.data) {
        const eventosFromBD = getAllEventsQuery.data.map((e: any) => ({
          id: e.id,
          sessionId: e.sessionId,
          eventType: e.eventType,
          timestamp: e.timestamp,
          ipPublica: e.ipPublica || 'Desconocida',
          ipPrivada: e.ipPrivada || 'No disponible',
          userAgent: e.userAgent || '',
          navegador: e.navegador || 'Desconocido',
          sistemaOperativo: e.sistemaOperativo || 'Desconocido',
          dispositivo: e.dispositivo || 'Desconocido',
          tiempoActivo: e.tiempoActivo || 0,
          paginaVisitada: e.paginaVisitada || '',
          email: e.email,
          nombre: e.nombre,
          detalles: e.detalles ? JSON.parse(e.detalles) : undefined,
        }));
        setEventos(eventosFromBD);
      } else {
        // Fallback a localStorage si BD no está disponible
        const eventosGuardados = localStorage.getItem('susuerte_eventos');
        if (eventosGuardados) {
          try {
            const eventosArray = JSON.parse(eventosGuardados);
            setEventos(eventosArray);
          } catch (error) {
            console.error('Error al parsear eventos:', error);
            setEventos([]);
          }
        }
      }
    }
  }, [authenticated, getAllRegistrosQuery.data, getAllEventsQuery.data]);

  // Auto-refresh cada 5 segundos
  useEffect(() => {
    if (!authenticated) return;

    const interval = setInterval(() => {
      getAllRegistrosQuery.refetch();
      // También recargar eventos desde localStorage
      const eventosGuardados = localStorage.getItem('susuerte_eventos');
      if (eventosGuardados) {
        try {
          const eventosArray = JSON.parse(eventosGuardados);
          setEventos(eventosArray);
        } catch (error) {
          console.error('Error al parsear eventos:', error);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [authenticated, getAllRegistrosQuery]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      setAuthenticated(true);
      setUsername('');
      setPassword('');
    } else {
      alert('Credenciales inválidas');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setRegistros([]);
    setEventos([]);
    setUsername('');
    setPassword('');
  };

  const updateRegistroMutation = trpc.susuert.updateRegistro.useMutation();
  const deleteAllRegistrosMutation = trpc.susuert.deleteAllRegistros.useMutation();
  const deleteAllEventsMutation = trpc.susuert.deleteAllEvents.useMutation();

  const toggleVerificacion = (id: number) => {
    const registro = registros.find(r => r.id === id);
    if (!registro) return;

    const estadoActual = registro.verificado;
    const nuevoEstado = estadoActual === 'pendiente' ? 'verificado' : estadoActual === 'verificado' ? 'rechazado' : 'pendiente';

    updateRegistroMutation.mutate(
      { id, verificado: nuevoEstado as any },
      {
        onSuccess: () => {
          setRegistros(registros.map(r => r.id === id ? { ...r, verificado: nuevoEstado as any } : r));
        },
      }
    );
  };

  // Cálculos de métricas
  const totalClics = eventos.filter(e => e.eventType === 'BUTTON_CLICK').length;
  const totalRegistros = registros.length;
  const usuariosUnicos = new Set(registros.map(r => r.email)).size;
  const ipsUnicas = new Set(eventos.map(e => e.ipPublica)).size;
  const registrosVerificados = registros.filter(r => r.verificado === 'verificado').length;
  const registrosPendientes = registros.filter(r => r.verificado === 'pendiente').length;
  const registrosRechazados = registros.filter(r => r.verificado === 'rechazado').length;

  // Contar usuarios únicos por SO (no eventos)
  const soCount = registros.reduce((acc, r) => {
    const so = r.os || 'Desconocido';
    acc[so] = (acc[so] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contar usuarios únicos por navegador (no eventos)
  const browserCount = registros.reduce((acc, r) => {
    const nav = r.browser || 'Desconocido';
    acc[nav] = (acc[nav] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Contar usuarios únicos por dispositivo (no eventos)
  const deviceCount = registros.reduce((acc, r) => {
    const dev = r.deviceType || 'Desconocido';
    acc[dev] = (acc[dev] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg p-8"
        >
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Panel Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 mb-2">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-400"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded transition"
            >
              Iniciar Sesión
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">📊 Panel Administrativo</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', label: '📈 Dashboard' },
            { id: 'usuarios', label: '👥 Usuarios' },
            { id: 'eventos', label: '🖱️ Eventos' },
            { id: 'estadisticas', label: '📊 Estadísticas' },
            { id: 'exportar', label: '💾 Exportar' },
            { id: 'logs', label: '📋 Logs' },
            { id: 'configuracion', label: '⚙️ Configuración' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Resumen General</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Total de Clics</p>
                <p className="text-4xl font-bold text-blue-400">{totalClics}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Total de Registros</p>
                <p className="text-4xl font-bold text-green-400">{totalRegistros}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Usuarios Únicos</p>
                <p className="text-4xl font-bold text-yellow-400">{usuariosUnicos}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">IPs Únicas</p>
                <p className="text-4xl font-bold text-purple-400">{ipsUnicas}</p>
              </div>
            </div>

            {/* Estado de Registros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-400">{registrosPendientes}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Verificados</p>
                <p className="text-3xl font-bold text-green-400">{registrosVerificados}</p>
              </div>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <p className="text-gray-400 text-sm mb-2">Rechazados</p>
                <p className="text-3xl font-bold text-red-400">{registrosRechazados}</p>
              </div>
            </div>

            {/* Distribución por SO */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Distribución por Sistema Operativo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(soCount).map(([so, count]) => (
                  <div key={so} className="bg-gray-700 rounded p-4">
                    <p className="text-gray-400 text-sm mb-2">{so}</p>
                    <p className="text-2xl font-bold text-blue-400">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por Navegador */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Distribución por Navegador</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(browserCount).map(([nav, count]) => (
                  <div key={nav} className="bg-gray-700 rounded p-4">
                    <p className="text-gray-400 text-sm mb-2">{nav}</p>
                    <p className="text-2xl font-bold text-green-400">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribución por Dispositivo */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Distribución por Dispositivo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(deviceCount).map(([dev, count]) => (
                  <div key={dev} className="bg-gray-700 rounded p-4">
                    <p className="text-gray-400 text-sm mb-2">{dev}</p>
                    <p className="text-2xl font-bold text-purple-400">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Usuarios Tab */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Registros de Usuarios</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4">Nombre</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Teléfono</th>
                    <th className="text-left py-3 px-4">Documento</th>
                    <th className="text-left py-3 px-4">Dispositivo</th>
                    <th className="text-left py-3 px-4">Navegador</th>
                    <th className="text-left py-3 px-4">SO</th>
                    <th className="text-left py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.map(registro => (
                    <tr key={registro.id} className="border-b border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4">{registro.nombre}</td>
                      <td className="py-3 px-4">{registro.email}</td>
                      <td className="py-3 px-4">{registro.telefono || '-'}</td>
                      <td className="py-3 px-4">{registro.documento}</td>
                      <td className="py-3 px-4">{registro.deviceType || 'Desconocido'}</td>
                      <td className="py-3 px-4">{registro.browser || 'Desconocido'}</td>
                      <td className="py-3 px-4">{registro.os || 'Desconocido'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleVerificacion(registro.id)}
                          className={`px-3 py-1 rounded text-white font-semibold ${
                            registro.verificado === 'pendiente'
                              ? 'bg-yellow-600 hover:bg-yellow-700'
                              : registro.verificado === 'verificado'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {registro.verificado === 'pendiente'
                            ? '⏳ Pendiente'
                            : registro.verificado === 'verificado'
                            ? '✅ Verificado'
                            : '❌ Rechazado'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Eventos Tab */}
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

        {/* Exportar Tab */}
        {activeTab === 'exportar' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Exportar Datos</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <button
                onClick={() => {
                  const csv = [
                    ['Nombre', 'Email', 'Teléfono', 'Documento', 'Dispositivo', 'Navegador', 'SO', 'Estado', 'Fecha'].join(','),
                    ...registros.map(r =>
                      [r.nombre, r.email, r.telefono || '', r.documento, r.deviceType || '', r.browser || '', r.os || '', r.verificado, r.timestamp].join(',')
                    ),
                  ].join('\n');

                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `registros_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                }}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                📥 Descargar CSV
              </button>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold mb-6">Logs del Sistema</h2>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <p className="text-gray-400">Sección de logs en construcción...</p>
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
                    deleteAllRegistrosMutation.mutate(undefined, {
                      onSuccess: () => {
                        localStorage.removeItem('susuerte_registros');
                        setRegistros([]);
                      },
                      onError: (error) => {
                        alert('Error al limpiar registros: ' + error.message);
                      },
                    });
                    deleteAllEventsMutation.mutate(undefined, {
                      onSuccess: () => {
                        localStorage.removeItem('susuerte_eventos');
                        setEventos([]);
                        alert('Datos limpiados correctamente');
                      },
                      onError: (error) => {
                        alert('Error al limpiar eventos: ' + error.message);
                      },
                    });
                  }
                }}
                className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                🗑️ Limpiar Todos los Datos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
