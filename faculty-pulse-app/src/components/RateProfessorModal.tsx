import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Slider } from '@/shared/ui/slider';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// Schema Anti-Spam
const reviewSchema = z.object({
  subject: z.string().min(3, "Indica la materia (ej: Cálculo I)"),
  quality: z.number().min(1).max(10),
  difficulty: z.number().min(1).max(10),
  comment: z.string()
    .min(30, "Tu opinión es valiosa. Escribe al menos 30 caracteres para ayudar a otros.")
    .max(500, "Máximo 500 caracteres.")
    .refine(val => !/(.)\1{4,}/.test(val), "Evita repetir caracteres (spam)."), // Anti "aaaaaa"
  takeAgain: z.boolean(),
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface RateProfessorModalProps {
  isOpen: boolean;
  onClose: () => void;
  professorName: string;
  university: string;
  onSuccess: () => void;
}

export const RateProfessorModal: React.FC<RateProfessorModalProps> = ({ 
  isOpen, onClose, professorName, university, onSuccess 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      quality: 5,
      difficulty: 5,
      takeAgain: true,
      comment: '',
      subject: ''
    }
  });

  const onSubmit = async (data: ReviewForm) => {
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para opinar.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        professor_name: professorName,
        university: university,
        subject: data.subject,
        quality_rating: data.quality,
        difficulty_rating: data.difficulty,
        comment: data.comment,
        take_again: data.takeAgain,
        status: 'APPROVED' // Auto-approve for MVP, moderation later
      });

      if (error) throw error;

      toast({ 
        title: "¡Gracias por contribuir!", 
        description: "Has desbloqueado el análisis avanzado." 
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aporta a la Comunidad</DialogTitle>
          <DialogDescription>
            Para ver el análisis detallado con IA, califica a un profesor con el que hayas cursado.
            <br/>
            <span className="text-xs font-medium text-primary mt-1 block">
              Estás calificando a: {professorName}
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-2">
          
          <div className="space-y-2">
            <Label>Materia Cursada</Label>
            <Input {...form.register('subject')} placeholder="Ej: Física II" />
            {form.formState.errors.subject && (
              <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="flex justify-between">
                Calidad
                <span className="font-bold text-primary">{form.watch('quality')}</span>
              </Label>
              <Slider 
                min={1} max={10} step={1} 
                value={[form.watch('quality')]} 
                onValueChange={(v) => form.setValue('quality', v[0])}
                className="py-2"
              />
            </div>
            <div className="space-y-3">
              <Label className="flex justify-between">
                Dificultad
                <span className="font-bold text-orange-600">{form.watch('difficulty')}</span>
              </Label>
              <Slider 
                min={1} max={10} step={1} 
                value={[form.watch('difficulty')]} 
                onValueChange={(v) => form.setValue('difficulty', v[0])}
                className="py-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>¿Lo tomarías de nuevo?</Label>
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant={form.watch('takeAgain') ? 'default' : 'outline'}
                onClick={() => form.setValue('takeAgain', true)}
                className="flex-1 gap-2"
              >
                <ThumbsUp className="h-4 w-4" /> Sí
              </Button>
              <Button 
                type="button" 
                variant={!form.watch('takeAgain') ? 'destructive' : 'outline'}
                onClick={() => form.setValue('takeAgain', false)}
                className="flex-1 gap-2"
              >
                <ThumbsDown className="h-4 w-4" /> No
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Comentario (Mín. 30 caracteres)</Label>
            <Textarea 
              {...form.register('comment')} 
              placeholder="¿Qué tal explica? ¿Es justo calificando?"
              className="h-24 resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{form.watch('comment').length} / 500</span>
              {form.formState.errors.comment && (
                <span className="text-destructive font-medium">{form.formState.errors.comment.message}</span>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar y Desbloquear
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
