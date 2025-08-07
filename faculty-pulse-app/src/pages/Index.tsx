import React, { useState } from 'react';
import { Professor } from '@/types/professor';
import { FileUploader } from '@/components/FileUploader';
import { ProfessorList } from '@/components/ProfessorList';
import { ProfessorProfile } from '@/components/ProfessorProfile';
import { Button } from '@/components/ui/button';
import { GraduationCap, ArrowRight, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ViewMode = 'upload' | 'list' | 'profile';

const Index = () => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const { toast } = useToast();

  const handleFilesLoaded = (loadedProfessors: Professor[]) => {
    setProfessors(loadedProfessors);
    setViewMode('list');
  };

  const handleLoadSampleData = async () => {
    try {
      const response = await fetch('/prueba.json');
      const data = await response.json();
      
      // Handle both single professor object and array of professors
      const professorsArray = Array.isArray(data) ? data : [data];
      
      setProfessors(professorsArray);
      setViewMode('list');
      
      toast({
        title: "Datos de ejemplo cargados",
        description: `Se cargó ${professorsArray.length} profesor(es) desde prueba.json`,
      });
    } catch (error) {
      toast({
        title: "Error al cargar datos de ejemplo",
        description: "No se pudo cargar el archivo prueba.json",
        variant: "destructive",
      });
    }
  };

  const handleProfessorSelect = (professor: Professor) => {
    setSelectedProfessor(professor);
    setViewMode('profile');
  };

  const handleBackToList = () => {
    setSelectedProfessor(null);
    setViewMode('list');
  };

  const handleAIAnalysis = async (professor: Professor) => {
    toast({
      title: "Análisis IA iniciado",
      description: `Procesando datos de ${professor.nombre}...`,
    });
    
    // Aquí iría la llamada al backend en Python
    setTimeout(() => {
      toast({
        title: "Análisis completado",
        description: "Los resultados están listos para revisión",
      });
    }, 2000);
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-academic-info bg-clip-text text-transparent">
                  EvaluaProf
                </h1>
              </div>
              <p className="text-xl text-muted-foreground mb-6">
                Plataforma de análisis y visualización de perfiles académicos
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <span>Carga archivos JSON</span>
                <ArrowRight className="h-4 w-4" />
                <span>Explora perfiles</span>
                <ArrowRight className="h-4 w-4" />
                <span>Análisis IA</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <FileUploader onFilesLoaded={handleFilesLoaded} />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">O prueba con datos de ejemplo</p>
                <Button 
                  variant="outline" 
                  onClick={handleLoadSampleData}
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  Cargar prueba.json
                </Button>
              </div>
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Profesores</h1>
                <p className="text-muted-foreground">
                  Explora y filtra los perfiles académicos cargados
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setViewMode('upload')}
              >
                Cargar más archivos
              </Button>
            </div>
            <ProfessorList 
              professors={professors} 
              onProfessorSelect={handleProfessorSelect} 
            />
          </div>
        );
      
      case 'profile':
        return selectedProfessor ? (
          <ProfessorProfile 
            professor={selectedProfessor}
            onBack={handleBackToList}
            onAIAnalysis={handleAIAnalysis}
          />
        ) : null;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default Index;
