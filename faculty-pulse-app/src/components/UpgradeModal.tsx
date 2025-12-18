import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Zap, Check, ShieldCheck } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Zap className="h-10 w-10 fill-current" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">Desbloquea EvaluaProf Pro</DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Lleva tu planeación académica al siguiente nivel con nuestras herramientas inteligentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {[
              "Auto-generador de horarios (Matemático)",
              "Análisis avanzado de sentimiento AI",
              "Guardado en la nube ilimitado",
              "Exportación a Google Calendar / ICS",
              "Sin anuncios y soporte prioritario"
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/50 rounded-lg border border-border mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-lg">Plan Semestral</span>
              <span className="text-2xl font-black text-primary">$50 <span className="text-xs font-normal text-muted-foreground">MXN</span></span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pago único por semestre académico. Incluye todas las actualizaciones.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button className="w-full gap-2 text-lg h-12" size="lg">
            Mejorar a Pro Ahora
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Tal vez después
          </Button>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest mt-2">
          <ShieldCheck className="h-3 w-3" /> Pago Seguro vía Stripe
        </div>
      </DialogContent>
    </Dialog>
  );
};
