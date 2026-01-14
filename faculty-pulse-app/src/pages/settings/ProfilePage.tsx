import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Loader2, LogOut, Save, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/shared/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Local state for edits
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [newPassword, setNewPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;
      toast({ title: "Perfil actualizado", description: "Tu nombre ha sido guardado." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Contraseña débil", description: "Debe tener al menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Contraseña actualizada", description: "Usa tu nueva contraseña la próxima vez." });
      setNewPassword('');
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // --- UNAUTHENTICATED STATE ---
  if (!user) {
    return (
      <div className="container mx-auto max-w-2xl py-20 px-4 text-center space-y-6">
        <div className="flex justify-center">
          <Shield className="h-16 w-16 text-muted-foreground/50" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Inicia sesión para ver tu perfil</h1>
        <p className="text-muted-foreground">
          Necesitas una cuenta para gestionar tu configuración y ver tu estado.
        </p>
        <Button onClick={() => navigate('/auth')} size="lg">
          Iniciar Sesión / Registrarse
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-6 sm:py-10 px-4 space-y-6 sm:y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestiona tu cuenta y seguridad.</p>
        </div>
        <Button variant="outline" onClick={handleSignOut} className="text-destructive hover:bg-destructive/10 w-full sm:w-auto">
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil Público</CardTitle>
            <CardDescription>Información visible en la plataforma.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 text-center sm:text-left">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-lg">{profile?.full_name?.[0] || user.email?.[0]}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 content-center min-w-0 flex-1">
                <div className="font-medium truncate text-lg sm:text-base">{user.email}</div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant={profile?.role === 'STUDENT_PRO' ? 'default' : 'secondary'}>
                    {profile?.role === 'STUDENT_PRO' ? 'PLAN PRO' : 'PLAN GRATUITO'}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    Activo
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <span className="text-muted-foreground block mb-1">ID de Usuario</span>
                <span className="font-mono text-xs text-foreground/80 break-all">{user.id}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Último Acceso</span>
                <span>{new Date(user.last_sign_in_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre Completo</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="flex-1"
                />
                <Button onClick={handleUpdateProfile} disabled={isLoading} className="shrink-0 w-full sm:w-auto">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  <span className="sm:hidden">Guardar</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>Actualiza tu contraseña.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva Contraseña</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="flex-1"
                />
                <Button onClick={handleChangePassword} disabled={isLoading || !newPassword} className="shrink-0 w-full sm:w-auto">
                  Actualizar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
