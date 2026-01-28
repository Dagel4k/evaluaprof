import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
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

  const SITE_URL = import.meta.env.VITE_SITE_URL || 'https://evaluaprof.com';

  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isPro = hasPermission(profile?.role, 'view-advanced-metrics');
  const evaluationsCount = profile?.evaluations_count || 0;

  const handleAnalysisClick = async () => {
    // 1. Pro Access or Sufficient Contributions
    if (isPro || evaluationsCount >= 3) {
      setShowAnalysis(true);
      return;
    }

    // Double check with server just in case state is stale
    if (user) {
      await refreshProfile();
      // Re-read after refresh
    }

    if (isPro || (profile?.evaluations_count || 0) >= 3) {
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
      <Helmet>
        <title>{`${professor.nombre} - Evaluaciones y Reseñas | EvaluaProf`}</title>
        <meta name="description" content={`Lee reseñas, calificaciones y opiniones reales de estudiantes sobre ${professor.nombre}, profesor de ${professor.departamento || professor.universidad}. Nivel de dificultad: ${professor.nivel_dificultad}/10.`} />
        <link rel="canonical" href={`${SITE_URL}/profesores/${professor.nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="profile" />
        <meta property="og:title" content={`${professor.nombre} - Evaluaciones y Reseñas`} />
        <meta property="og:description" content={`Descubre qué dicen los estudiantes sobre ${professor.nombre}. Calidad general: ${professor.calidad_general}/10. Dificultad: ${professor.nivel_dificultad}/10.`} />
        <meta property="og:site_name" content="EvaluaProf" />
        <meta property="og:url" content={`${SITE_URL}/profesores/${professor.nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`} />
        <meta property="profile:first_name" content={professor.nombre.split(' ')[0]} />
        <meta property="profile:last_name" content={professor.nombre.split(' ').slice(1).join(' ')} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${professor.nombre} - Opiniones de Alumnos`} />
        <meta name="twitter:description" content={`¿Buscas referencias de ${professor.nombre}? Revisa ${professor.numero_calificaciones} evaluaciones de estudiantes reales.`} />

        {/* Schema.org JSON-LD - Breadcrumb */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "Inicio",
              "item": `${SITE_URL}`
            }, {
              "@type": "ListItem",
              "position": 2,
              "name": "Profesores",
              "item": `${SITE_URL}/profesores`
            }, {
              "@type": "ListItem",
              "position": 3,
              "name": professor.nombre,
              "item": `${SITE_URL}/profesores/${professor.nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`
            }]
          })}
        </script>

        {/* Schema.org JSON-LD - Person */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": professor.nombre,
            "jobTitle": "Professor",
            "url": `${SITE_URL}/profesores/${professor.nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')}`,
            "affiliation": {
              "@type": "CollegeOrUniversity",
              "name": professor.universidad || "Universidad"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": professor.calidad_general,
              "reviewCount": professor.numero_calificaciones || 1,
              "bestRating": "10",
              "worstRating": "0"
            }
          })}
        </script>
      </Helmet>

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

      <ProfileHeader
        professor={professor}
        onBack={onBack}
        onAIAnalysis={handleAnalysisClick}
        onAdvancedAnalytics={() => { }}
      />

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