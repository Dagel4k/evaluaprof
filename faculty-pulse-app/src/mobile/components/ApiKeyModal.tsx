import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Card } from '@/shared/ui/card';
import { 
  Key, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  Shield, 
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useApiKey } from '@/mobile/hooks/useApiKey';
import { Native } from '@/shared/lib/native';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyConfigured: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onApiKeyConfigured
}) => {
  const [inputApiKey, setInputApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { validateApiKey, saveApiKey } = useApiKey();

  const handleSave = async () => {
    setError('');
    setIsLoading(true);

    const validation = validateApiKey(inputApiKey);
    if (!validation.isValid) {
      setError(validation.error || 'API key inválida');
      setIsLoading(false);
      return;
    }

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10000);
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${inputApiKey.trim()}`,
        },
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
        mode: 'cors'
      });
      clearTimeout(t);

      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('API key inválida o expirada');
        } else if (testResponse.status === 403) {
          throw new Error('API key sin permisos suficientes');
        } else {
          throw new Error(`Error ${testResponse.status}: ${testResponse.statusText}`);
        }
      }

      await saveApiKey(inputApiKey.trim());
      onApiKeyConfigured(inputApiKey.trim());
      await Native.hapticImpact('light');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al validar la API key');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setInputApiKey('');
    setError('');
    setShowApiKey(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-xl sm:mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-blue-600" />
            <span className="break-anywhere">Configurar API Key de OpenAI</span>
          </DialogTitle>
          <DialogDescription>
            <span className="break-anywhere">Para usar el análisis de IA, necesitas tu propia API key de OpenAI. Esta clave se almacena solo en tu navegador, es un proyecto open source.</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de seguridad */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Privacidad y Seguridad</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Tu API key se almacena solo en tu navegador (localStorage)</li>
                  <li>• No se envía a ningún servidor externo</li>
                  <li>• Solo se usa para comunicarse directamente con OpenAI</li>
                  <li>• Puedes eliminarla en cualquier momento</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Instrucciones */}
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200/50">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">¿Cómo obtener una API Key?</h4>
                <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                  <li>1. Ve a <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 break-anywhere">platform.openai.com/api-keys <ExternalLink className="h-3 w-3" /></a></li>
                  <li>2. Inicia sesión en tu cuenta de OpenAI</li>
                  <li>3. Haz clic en "Create new secret key"</li>
                  <li>4. Copia la clave y pégala aquí</li>
                </ol>
              </div>
            </div>
          </Card>

          {/* Input de API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key de OpenAI</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={inputApiKey}
                onChange={(e) => setInputApiKey(e.target.value)}
                className="pr-10"
                autoComplete="off"
                inputMode="text"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              La API key debe comenzar con "sk-" y tener al menos 20 caracteres
            </p>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="break-anywhere">{error}</AlertDescription>
            </Alert>
          )}

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!inputApiKey || isLoading}
              className="gap-2 w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Guardar y Probar
                </>
              )}
            </Button>
          </div>

          {/* Nota sobre costos */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Nota sobre costos:</strong> El uso de la API de OpenAI tiene costo. 
              Cada análisis consume aproximadamente 0.01-0.03 USD. 
              Revisa tu uso en <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com/usage</a>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
};
