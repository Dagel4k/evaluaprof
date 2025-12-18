import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Slider } from '@/shared/ui/slider';
import { Label } from '@/shared/ui/label';
import { Check, Search, Star, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { ProfessorLoaderService } from '@/services/professorLoader';
import { Professor } from '@/types/professor';

const MIN_REVIEWS = 3;

export const EvaluatePage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [step, setStep] = useState<'SELECT' | 'RATE' | 'DONE'>('SELECT');
  const [allProfessors, setAllProfessors] = useState<Professor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessors, setSelectedProfessors] = useState<Professor[]>([]);
  const [currentEvalIndex, setCurrentEvalIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for current evaluation
  const [rating, setRating] = useState({ quality: 5, difficulty: 5, takeAgain: true, comment: '' });

  useEffect(() => {
    // Check if already completed
    if (profile?.evaluations_count && profile.evaluations_count >= MIN_REVIEWS) {
      handleFinish();
    }
    // Load professors for search
    ProfessorLoaderService.loadAllProfessors().then(res => setAllProfessors(res.professors));
  }, [profile]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredProfessors = searchQuery.length > 2 
    ? allProfessors.filter(p => 
        p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedProfessors.some(sel => sel.nombre === p.nombre)
      ).slice(0, 5)
    : [];

  const handleSelect = (prof: Professor) => {
    if (selectedProfessors.length >= MIN_REVIEWS) return;
    setSelectedProfessors([...selectedProfessors, prof]);
    setSearchQuery('');
  };

  const handleRemove = (index: number) => {
    const newSelected = [...selectedProfessors];
    newSelected.splice(index, 1);
    setSelectedProfessors(newSelected);
  };

  const submitEvaluation = async () => {
    if (!user) return;
    setIsSubmitting(true);
    
    const professor = selectedProfessors[currentEvalIndex];
    
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        professor_name: professor.nombre,
        university: professor.universidad,
        subject: 'General', // Simplified for onboarding
        quality_rating: rating.quality,
        difficulty_rating: rating.difficulty,
        take_again: rating.takeAgain,
        comment: rating.comment || 'Evaluación rápida de onboarding',
        status: 'APPROVED'
      });

      if (error) throw error;

      if (currentEvalIndex < selectedProfessors.length - 1) {
        // Next review
        setCurrentEvalIndex(prev => prev + 1);
        setRating({ quality: 5, difficulty: 5, takeAgain: true, comment: '' }); // Reset form
      } else {
        // All done
        setStep('DONE');
        // Update local profile state optimistically if possible, or wait for auth refresh
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    const redirect = localStorage.getItem('redirectToAnalysisOf');
    if (redirect) {
      localStorage.removeItem('redirectToAnalysisOf');
      navigate(`/profesores/${redirect}`);
    } else {
      navigate('/home');
    }
  };

  // --- RENDER ---

  if (step === 'SELECT') {
    return (
      <div className="container max-w-md py-10 px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Activa tu Cuenta Freemium</h1>
          <p className="text-muted-foreground">
            Para desbloquear el análisis IA, necesitamos tu experiencia. Evalúa a <b>3 profesores</b> con los que ya hayas cursado.
          </p>
        </div>

        <Card className="p-4 space-y-4">
          <div className="space-y-2">
            <Label>Busca a tus profesores anteriores</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Nombre del profesor..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            {filteredProfessors.length > 0 && (
              <div className="border rounded-md divide-y bg-background">
                {filteredProfessors.map(p => (
                  <button 
                    key={p.nombre}
                    className="w-full text-left p-3 hover:bg-muted text-sm flex justify-between items-center"
                    onClick={() => handleSelect(p)}
                  >
                    <span>{p.nombre}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{p.departamento}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">
              Seleccionados ({selectedProfessors.length}/{MIN_REVIEWS})
            </Label>
            {selectedProfessors.length === 0 ? (
              <div className="text-sm text-muted-foreground italic py-2 text-center border-dashed border-2 rounded">
                Agrega 3 profesores para continuar
              </div>
            ) : (
              <div className="space-y-2">
                {selectedProfessors.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-muted/50 p-2 rounded text-sm">
                    <span className="font-medium">{p.nombre}</span>
                    <button onClick={() => handleRemove(idx)} className="text-muted-foreground hover:text-destructive">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            className="w-full" 
            disabled={selectedProfessors.length < MIN_REVIEWS}
            onClick={() => setStep('RATE')}
          >
            Continuar a Evaluaciones
          </Button>
        </Card>
      </div>
    );
  }

  if (step === 'RATE') {
    const currentProf = selectedProfessors[currentEvalIndex];
    const progress = ((currentEvalIndex) / selectedProfessors.length) * 100;

    return (
      <div className="container max-w-md py-10 px-4 space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Evaluando {currentEvalIndex + 1} de {selectedProfessors.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <Card className="p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold">{currentProf.nombre}</h2>
            <p className="text-sm text-muted-foreground">{currentProf.departamento}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex justify-between">Calidad <span className="font-bold text-primary">{rating.quality}</span></Label>
              <Slider 
                min={1} max={10} step={1} 
                value={[rating.quality]} 
                onValueChange={v => setRating({...rating, quality: v[0]})} 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex justify-between">Dificultad <span className="font-bold text-orange-600">{rating.difficulty}</span></Label>
              <Slider 
                min={1} max={10} step={1} 
                value={[rating.difficulty]} 
                onValueChange={v => setRating({...rating, difficulty: v[0]})} 
              />
            </div>

            <div className="space-y-2">
              <Label>¿Lo recomendarías?</Label>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant={rating.takeAgain ? 'default' : 'outline'}
                  onClick={() => setRating({...rating, takeAgain: true})}
                  className="flex-1"
                >
                  <ThumbsUp className="mr-2 h-4 w-4" /> Sí
                </Button>
                <Button 
                  type="button" 
                  variant={!rating.takeAgain ? 'destructive' : 'outline'}
                  onClick={() => setRating({...rating, takeAgain: false})}
                  className="flex-1"
                >
                  <ThumbsDown className="mr-2 h-4 w-4" /> No
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comentario (Opcional)</Label>
              <Input 
                placeholder="Breve opinión..." 
                value={rating.comment}
                onChange={e => setRating({...rating, comment: e.target.value})}
              />
            </div>
          </div>

          <Button className="w-full" onClick={submitEvaluation} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : (currentEvalIndex === selectedProfessors.length - 1 ? 'Finalizar' : 'Siguiente Profesor')}
          </Button>
        </Card>
      </div>
    );
  }

  // DONE
  return (
    <div className="container max-w-md py-20 px-4 text-center space-y-6">
      <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
        <Check className="h-10 w-10 text-green-600" />
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">¡Acceso Activado!</h1>
        <p className="text-muted-foreground">
          Gracias por tu contribución. Ahora tienes acceso completo al análisis detallado de todos los profesores.
        </p>
      </div>

      <Button size="lg" className="w-full" onClick={handleFinish}>
        Vamos al análisis
      </Button>
    </div>
  );
};
