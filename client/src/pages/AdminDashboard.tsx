import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, Check, X, Search } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<'pendiente' | 'verificado' | 'rechazado'>('pendiente');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'pendiente' | 'verificado' | 'rechazado' | undefined>(undefined);
  
  const { data: registros, isLoading, error, refetch } = trpc.susuert.getAllRegistros.useQuery(undefined, {
    enabled: user?.role === 'admin' && !searchQuery && !filterStatus,
  });
  
  const { data: searchResults, isLoading: isSearching, error: searchError } = trpc.susuert.searchRegistros.useQuery(
    { query: searchQuery },
    { enabled: user?.role === 'admin' && searchQuery.length > 0 }
  );
  
  const { data: filterResults, isLoading: isFiltering, error: filterError } = trpc.susuert.filterRegistros.useQuery(
    { status: filterStatus },
    { enabled: user?.role === 'admin' && filterStatus !== undefined }
  );
  
  const displayedRegistros = searchQuery ? searchResults : filterStatus ? filterResults : registros;
  const isLoadingData = isLoading || isSearching || isFiltering;
  const displayError = searchQuery ? searchError : filterStatus ? filterError : error;
  
  const updateRegistroMutation = trpc.susuert.updateRegistro.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
      setNewStatus('pendiente');
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Requerido</h1>
          <p className="mb-6 text-gray-600">Debes iniciar sesión para acceder al panel de administración.</p>
          <Button onClick={() => window.location.href = getLoginUrl()}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="mb-6 text-gray-600">Solo los administradores pueden acceder a esta página.</p>
          <Button onClick={() => window.location.href = '/'}>
            Volver al Inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Bienvenido, {user.name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => logout()}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>

        {/* Registros */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Registros Recibidos</h2>
            <Badge variant="secondary">
              {displayedRegistros?.length || 0} registros
            </Badge>
          </div>

          {/* Search and Filter Bar */}
          <Card className="bg-white">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre, email o documento..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setFilterStatus(undefined);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={filterStatus || 'all'}
                    onValueChange={(value) => {
                      setFilterStatus(value === 'all' ? undefined : (value as any));
                      setSearchQuery('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="verificado">Verificado</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : displayError ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">Error al cargar los registros: {displayError.message}</p>
              </CardContent>
            </Card>
          ) : displayedRegistros && displayedRegistros.length > 0 ? (
            <div className="grid gap-4">
              {displayedRegistros.map((registro) => (
                <Card key={registro.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{registro.nombre}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{registro.email}</p>
                      </div>
                      {editingId === registro.id ? (
                        <div className="flex gap-2 items-center">
                          <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pendiente">Pendiente</SelectItem>
                              <SelectItem value="verificado">Verificado</SelectItem>
                              <SelectItem value="rechazado">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              if (newStatus) {
                                updateRegistroMutation.mutate({
                                  id: registro.id,
                                  verificado: newStatus,
                                });
                              }
                            }}
                            disabled={updateRegistroMutation.isPending}
                          >
                            {updateRegistroMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingId(null);
                              setNewStatus('pendiente');
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(registro.id);
                            setNewStatus(registro.verificado);
                          }}
                          className="whitespace-nowrap"
                        >
                          <Badge
                            variant={
                              registro.verificado === 'verificado'
                                ? 'default'
                                : registro.verificado === 'rechazado'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {registro.verificado}
                          </Badge>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Teléfono</p>
                        <p className="font-medium">{registro.telefono || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Documento</p>
                        <p className="font-medium">{registro.documento}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Dispositivo</p>
                        <p className="font-medium">{registro.deviceType || 'Desconocido'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Navegador</p>
                        <p className="font-medium text-xs">{registro.browser || 'Desconocido'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sistema Operativo</p>
                        <p className="font-medium text-xs">{registro.os || 'Desconocido'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Fecha de Registro</p>
                        <p className="font-medium text-xs">
                          {new Date(registro.createdAt).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-600 text-center">
                  {searchQuery || filterStatus
                    ? 'No se encontraron registros con los criterios de búsqueda.'
                    : 'No hay registros aún. Los registros aparecerán aquí cuando se envíe el formulario.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
