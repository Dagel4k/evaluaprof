import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { Professor } from '@/types/professor';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
  onFilesLoaded: (professors: Professor[]) => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processJsonData = (json: any): Professor[] => {
    // Handle array of professors
    if (Array.isArray(json)) {
      return json;
    }
    
    // Handle single professor object
    if (json && typeof json === 'object' && json.nombre) {
      return [json];
    }
    
    // Handle array of single professor objects
    if (Array.isArray(json) && json.length > 0 && json[0] && typeof json[0] === 'object' && json[0].nombre) {
      return json;
    }
    
    throw new Error('Formato JSON no válido. Se espera un objeto de profesor o un array de profesores.');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const filePromises = Array.from(files).map(file => {
      return new Promise<Professor[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const json = JSON.parse(e.target?.result as string);
            const professors = processJsonData(json);
            resolve(professors);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      });
    });

    Promise.all(filePromises)
      .then(professorsArrays => {
        // Flatten all professors from all files
        const allProfessors = professorsArrays.flat();
        onFilesLoaded(allProfessors);
        toast({
          title: "Archivos cargados exitosamente",
          description: `Se cargaron ${allProfessors.length} profesores desde ${files.length} archivo(s)`,
        });
      })
      .catch((error) => {
        console.error('Error processing files:', error);
        toast({
          title: "Error al cargar archivos",
          description: error.message || "Algunos archivos no pudieron ser procesados",
          variant: "destructive",
        });
      });
  };

  return (
    <Card className="p-8 text-center border-dashed border-2 hover:border-primary transition-colors">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-academic-secondary rounded-full">
          <Upload className="h-8 w-8 text-academic-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Cargar Perfiles de Profesores</h3>
          <p className="text-muted-foreground mb-4">
            Selecciona archivos JSON con los datos de los profesores
          </p>
          <p className="text-xs text-muted-foreground">
            Soporta tanto objetos individuales como arrays de profesores
          </p>
        </div>
        <Button 
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          Seleccionar Archivos
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </Card>
  );
};