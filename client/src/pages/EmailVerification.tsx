import { useEffect, useState } from 'react';
import { useSearchParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react';

type VerificationStatus = 'idle' | 'loading' | 'success' | 'error' | 'token_generated';

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [message, setMessage] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [copied, setCopied] = useState(false);

  const verifyMutation = trpc.susuert.verifyEmail.useMutation();
  const requestTokenMutation = trpc.susuert.requestEmailVerification.useMutation();

  // Si hay un token en la URL, verificar automáticamente
  useEffect(() => {
    if (token) {
      handleVerifyToken(token);
    }
  }, [token]);

  const handleVerifyToken = async (verificationToken: string) => {
    setVerificationStatus('loading');
    try {
      const result = await verifyMutation.mutateAsync({ token: verificationToken });
      
      if (result.success) {
        setVerificationStatus('success');
        setMessage('¡Email verificado exitosamente! Tu cuenta ha sido confirmada.');
      } else {
        setVerificationStatus('error');
        setMessage('No se pudo verificar el email. El token puede haber expirado.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Error al verificar el email. Por favor intenta de nuevo.');
    }
  };

  const handleRequestToken = async () => {
    if (!email) {
      setMessage('Por favor ingresa tu email');
      return;
    }

    setVerificationStatus('loading');
    try {
      const result = await requestTokenMutation.mutateAsync({ email });
      
      if (result.success) {
        setVerificationStatus('token_generated');
        setGeneratedToken(result.token);
        setMessage('Se ha generado un token de verificación. Copia el enlace de abajo para verificar tu email.');
        setEmail('');
      } else {
        setVerificationStatus('error');
        setMessage('No se pudo generar el token de verificación.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Error al solicitar verificación. Por favor intenta de nuevo.');
    }
  };

  const handleCopyToken = () => {
    const verificationLink = `${window.location.origin}/verify-email?token=${generatedToken}`;
    navigator.clipboard.writeText(verificationLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-gradient-to-br from-background to-secondary">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Verificación de Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {verificationStatus === 'idle' && !token && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Ingresa tu email para recibir un enlace de verificación
              </p>
              <div className="space-y-4">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={verifyMutation.isPending || requestTokenMutation.isPending}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRequestToken();
                    }
                  }}
                />
                <Button
                  onClick={handleRequestToken}
                  disabled={verifyMutation.isPending || requestTokenMutation.isPending || !email}
                  className="w-full"
                >
                  {verifyMutation.isPending || requestTokenMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Enlace de Verificación'
                  )}
                </Button>
              </div>
            </>
          )}

          {verificationStatus === 'loading' && token && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-center text-sm text-muted-foreground">
                Verificando tu email...
              </p>
            </div>
          )}

          {verificationStatus === 'loading' && !token && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-center text-sm text-muted-foreground">
                Generando token...
              </p>
            </div>
          )}

          {verificationStatus === 'token_generated' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="w-12 h-12 text-blue-600" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Token Generado</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              
              <div className="w-full bg-muted p-3 rounded-lg space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">Enlace de Verificación:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/verify-email?token=${generatedToken}`}
                    readOnly
                    className="flex-1 px-2 py-1 text-xs bg-background border rounded"
                  />
                  <Button
                    onClick={handleCopyToken}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-600">¡Copiado!</p>}
              </div>

              <Button
                onClick={() => {
                  setVerificationStatus('idle');
                  setEmail('');
                  setMessage('');
                  setGeneratedToken('');
                }}
                variant="outline"
                className="w-full"
              >
                Verificar Otro Email
              </Button>
            </div>
          )}

          {verificationStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">¡Éxito!</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button
                onClick={() => {
                  setVerificationStatus('idle');
                  setEmail('');
                  setMessage('');
                }}
                variant="outline"
                className="w-full"
              >
                Verificar Otro Email
              </Button>
            </div>
          )}

          {verificationStatus === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertCircle className="w-12 h-12 text-red-600" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">Error</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button
                onClick={() => {
                  setVerificationStatus('idle');
                  setEmail('');
                  setMessage('');
                }}
                variant="outline"
                className="w-full"
              >
                Intentar de Nuevo
              </Button>
            </div>
          )}

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>¿Necesitas ayuda? Contacta con soporte</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
