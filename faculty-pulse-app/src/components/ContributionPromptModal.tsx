import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Sparkles, Users, ArrowRight } from 'lucide-react';

interface ContributionPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ContributionPromptModal: React.FC<ContributionPromptModalProps> = ({ 
  isOpen, onClose, onConfirm 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4 w-fit">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Únete a la Comunidad</DialogTitle>
          <DialogDescription className="text-center pt-2">
            El análisis detallado con IA es una herramienta poderosa alimentada por estudiantes como tú.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-3">
            <p className="font-medium text-foreground">
              Para desbloquear este análisis, necesitamos tu ayuda:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Crea una cuenta gratuita.</span>
              </li>
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>Evalúa a 3 profesores con los que ya cursaste.</span>
              </li>
            </ul>
            <p className="text-xs text-muted-foreground pt-2 italic border-t border-border mt-3">
              "Tu experiencia ayuda a miles de estudiantes a tomar mejores decisiones."
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-purple-600">
            Registrarme y Contribuir
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
