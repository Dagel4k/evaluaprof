import React from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/ui/card';
import { Check, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PremiumLockScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="max-w-3xl w-full grid md:grid-cols-2 overflow-hidden border-2 border-primary/20 shadow-2xl">
        
        {/* Left: Value Proposition */}
        <div className="bg-primary/5 p-8 flex flex-col justify-center">
          <div className="mb-6">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Constructor de Horarios</h2>
            <p className="text-muted-foreground">
              La herramienta más potente para planear tu semestre está reservada para estudiantes Pro.
            </p>
          </div>
          
          <ul className="space-y-3">
            {[
              "Generador Automático con IA",
              "Detección de conflictos en tiempo real",
              "Análisis de dificultad de carga académica",
              "Comparación de profesores lado a lado"
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: Action */}
        <div className="p-8 flex flex-col justify-center bg-card">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Desbloquea el Acceso</CardTitle>
            <CardDescription>
              Invierte en tu éxito académico por menos de lo que cuesta un café.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-0 space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold">$50 MXN</span>
              <span className="text-muted-foreground font-medium">/ semestre</span>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs rounded-lg font-medium">
              ✨ Incluye acceso total a métricas avanzadas de profesores.
            </div>
          </CardContent>

          <CardFooter className="px-0 flex flex-col gap-3">
            <Button className="w-full h-12 text-lg gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all shadow-lg hover:shadow-primary/25">
              <Zap className="h-5 w-5 fill-current" />
              Obtener EvaluaProf Pro
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/profesores')}>
              Volver a buscar profesores
            </Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
};
