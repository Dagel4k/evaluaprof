import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { GraduationCap, Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Alert, AlertDescription } from '@/shared/ui/alert';

// --- Validation Schemas ---
const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  email: z.string().email("Ingresa un correo universitario o personal válido"),
  password: z.string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Debe tener una mayúscula")
    .regex(/[0-9]/, "Debe tener un número"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export const AuthPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Forms
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' }
  });

  // Handlers
  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });
      if (error) throw error;
      
      toast({ title: "Bienvenido de nuevo", description: "Sesión iniciada correctamente." });
      navigate('/home');
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error de acceso",
        description: error.message === "Invalid login credentials" 
          ? "Correo o contraseña incorrectos." 
          : error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.fullName },
          emailRedirectTo: window.location.origin + '/home'
        }
      });
      if (error) throw error;

      toast({ 
        title: "¡Cuenta creada!", 
        description: "Hemos enviado un enlace de confirmación a tu correo.",
        duration: 6000,
      });
      // Optionally switch to login tab or show success state
    } catch (error: any) {
      toast({ title: "Error al registrarse", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + '/home' }
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error con Google", description: error.message, variant: "destructive" });
    }
  };

  const handleResetPassword = async () => {
    const email = loginForm.getValues("email");
    if (!email || !loginForm.getFieldState("email").isDirty || loginForm.getFieldState("email").invalid) {
      toast({ title: "Recuperación", description: "Ingresa tu correo en el campo de login primero.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/settings/profile',
      });
      if (error) throw error;
      setResetSent(true);
      toast({ title: "Correo enviado", description: "Revisa tu bandeja de entrada para restablecer tu contraseña." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left side: Brand */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-primary/90" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <GraduationCap className="h-8 w-8" />
          <span className="text-2xl font-bold tracking-tight">EvaluaProf Pro</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg italic font-light text-white/90">
              "La educación es el pasaporte hacia el futuro, el mañana pertenece a aquellos que se preparan para él en el día de hoy."
            </p>
            <footer className="text-sm font-medium text-white/80">— Malcolm X</footer>
          </blockquote>
        </div>
      </div>

      {/* Right side: Forms */}
      <div className="lg:p-8 flex items-center justify-center">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Bienvenido</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa a tu portal académico
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Crear Cuenta</TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login">
              <Card className="border-none shadow-none bg-transparent">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...loginForm.register("email")}
                        placeholder="correo@universidad.edu"
                        className="pl-10"
                        autoComplete="email"
                      />
                    </div>
                    {loginForm.formState.errors.email && (
                      <p className="text-xs text-destructive ml-1">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...loginForm.register("password")}
                        type="password"
                        placeholder="Contraseña"
                        className="pl-10"
                        autoComplete="current-password"
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs text-destructive ml-1">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Acceder
                  </Button>
                </form>

                <div className="mt-4 text-center">
                  {resetSent ? (
                    <Alert className="mt-2 bg-green-50 border-green-200 text-green-800">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Correo de recuperación enviado.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleResetPassword}
                      className="text-xs text-primary hover:underline"
                      disabled={isLoading}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* REGISTER TAB */}
            <TabsContent value="register">
              <Card className="border-none shadow-none bg-transparent">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...registerForm.register("fullName")}
                        placeholder="Nombre Completo"
                        className="pl-10"
                      />
                    </div>
                    {registerForm.formState.errors.fullName && (
                      <p className="text-xs text-destructive ml-1">{registerForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...registerForm.register("email")}
                        placeholder="correo@universidad.edu"
                        className="pl-10"
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-xs text-destructive ml-1">{registerForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...registerForm.register("password")}
                        type="password"
                        placeholder="Contraseña (Mín. 8 caracteres, 1 Mayúscula, 1 Número)"
                        className="pl-10"
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-xs text-destructive ml-1">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <CheckCircle2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...registerForm.register("confirmPassword")}
                        type="password"
                        placeholder="Confirmar Contraseña"
                        className="pl-10"
                      />
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-destructive ml-1">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                  </Button>
                </form>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continuar con</span>
            </div>
          </div>

          <Button variant="outline" type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full">
            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
              <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
            </svg>
            Google
          </Button>

          <p className="px-8 text-center text-xs text-muted-foreground">
            Al continuar, aceptas nuestros{' '}
            <a href="/legal/terms" className="underline underline-offset-4 hover:text-primary">Términos</a> y{' '}
            <a href="/legal/privacy" className="underline underline-offset-4 hover:text-primary">Privacidad</a>.
          </p>
        </div>
      </div>
    </div>
  );
};