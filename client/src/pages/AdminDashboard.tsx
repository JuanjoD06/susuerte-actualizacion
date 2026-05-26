import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, LogOut } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function AdminDashboard() {
  const { user, loading: authLoading, logout } = useAuth();
  const { data: registros, isLoading, error } = trpc.susuert.getAllRegistros.useQuery(undefined, {
    enabled: user?.role === 'admin',
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
              {registros?.length || 0} registros
            </Badge>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin w-8 h-8" />
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-800">Error al cargar los registros: {error.message}</p>
              </CardContent>
            </Card>
          ) : registros && registros.length > 0 ? (
            <div className="grid gap-4">
              {registros.map((registro) => (
                <Card key={registro.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{registro.nombre}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{registro.email}</p>
                      </div>
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
                  No hay registros aún. Los registros aparecerán aquí cuando se envíe el formulario.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
