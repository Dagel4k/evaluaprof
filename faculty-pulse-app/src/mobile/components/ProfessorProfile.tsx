import React, { useState } from 'react';
import { Professor } from '@/types/professor';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { ArrowLeft, Sparkles, Share2 } from 'lucide-react';
import { ProfileHeader } from './profile/ProfileHeader';
import { ProfileStats } from './profile/ProfileStats';
import { ProfileCharts } from './profile/ProfileCharts';
import { ProfileWordCloud } from './profile/ProfileWordCloud';
import { ProfileReviews } from './profile/ProfileReviews';
import { AIAnalysisModal } from './AIAnalysisModal';
import { useAuth } from '@/context/AuthContext';
import { hasPermission } from '@/lib/permissions';
import { useNavigate } from 'react-router-dom';
import { ContributionPromptModal } from '@/components/ContributionPromptModal';

interface ProfessorProfileProps {
  professor: Professor;
  onBack: () => void;
  onAIAnalysis: (professor: Professor) => Promise<void>;
}

export const ProfessorProfile: React.FC<ProfessorProfileProps> = ({
  professor,
  onBack
}) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const isPro = hasPermission(profile?.role, 'view-advanced-metrics');
  const evaluationsCount = profile?.evaluations_count || 0;

  const handleAnalysisClick = () => {
    // 1. Pro Access or Sufficient Contributions
    if (isPro || evaluationsCount >= 3) {
      setShowAnalysis(true);
      return;
    }

    // Save intention
    const slug = professor.nombre.toLowerCase().replace(/\s+/g, '-');
    localStorage.setItem('redirectToAnalysisOf', slug);

    // 2. Redirect Logic
    if (!user) {
      // Show prompt first to explain WHY
      setShowPrompt(true);
    } else {
      // Logged in but needs to contribute -> Onboarding
      navigate('/onboarding/evaluate');
    }
  };

  const handlePromptConfirm = () => {
    setShowPrompt(false);
    navigate('/auth');
  };

  return (
    <div className="space-y-4 pb-20 animate-in slide-in-from-right-4 duration-300">
      {/* Navigation */}
      <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
        <Button variant="ghost" onClick={onBack} className="gap-2 pl-0 hover:pl-2 transition-all">
          <ArrowLeft className="h-5 w-5" />
          Volver
        </Button>
        <Button variant="ghost" size="icon">
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      <ProfileHeader professor={professor} />

      {/* Action Button - Intercepted */}
      <Card className="p-4 bg-gradient-to-r from-academic-primary/10 to-purple-500/10 border-academic-primary/20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-academic-primary" />
            <h3 className="font-semibold">Análisis de Inteligencia Artificial</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Obtén un resumen detallado sobre la dificultad, personalidad y consejos para aprobar con este profesor.
          </p>
          <Button
            className="w-full gap-2 bg-gradient-to-r from-academic-primary to-purple-600 hover:opacity-90"
            onClick={handleAnalysisClick}
          >
            <Sparkles className="h-4 w-4" />
            Ver Análisis Detallado
          </Button>
        </div>
      </Card>

      <ProfileStats professor={professor} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ProfileCharts professor={professor} />
        <ProfileWordCloud professor={professor} />
      </div>

      <ProfileReviews professor={professor} />

      {/* Modals */}
      <AIAnalysisModal
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        professor={professor}
      />

      <ContributionPromptModal
        isOpen={showPrompt}
        onClose={() => setShowPrompt(false)}
        onConfirm={handlePromptConfirm}
      />
    </div>
  );
};