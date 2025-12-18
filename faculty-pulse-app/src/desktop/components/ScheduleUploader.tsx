import React, { useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Upload, Calendar, FileJson } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { RawCourseEntry } from '@/adapters/scheduleAdapter';

interface ScheduleUploaderProps {
  onScheduleLoaded: (schedule: RawCourseEntry[]) => void;
}

export const ScheduleUploader: React.FC<ScheduleUploaderProps> = ({ onScheduleLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        
        // Simple validation: Check if it's an array and has expected fields
        if (!Array.isArray(json)) {
          throw new Error("El archivo debe ser un arreglo de materias JSON.");
        }
        if (json.length > 0 && (!json[0].clave || !json[0].materia)) {
           throw new Error("El formato del JSON no parece ser un horario válido (faltan campos 'clave' o 'materia').");
        }

        onScheduleLoaded(json as RawCourseEntry[]);
        toast({
          title: "Horario cargado",
          description: `Se importaron ${json.length} materias correctamente.`,
        });
      } catch (error: any) {
        console.error('Error parsing schedule:', error);
        toast({
          title: "Error de formato",
          description: error.message || "No se pudo leer el archivo JSON.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/json") {
      processFile(file);
    } else if (file) {
      toast({
         title: "Archivo inválido",
         description: "Por favor arrastra un archivo .json",
         variant: "destructive"
      });
    }
  };

  return (
    <Card 
      className={`p-12 text-center border-dashed border-2 transition-all duration-200 ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'hover:border-primary/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
        <div className={`p-6 rounded-full transition-colors ${isDragging ? 'bg-primary/20' : 'bg-muted'}`}>
          <Calendar className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight">Importar Horario</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Arrastra tu archivo JSON descargado del portal universitario, 
            o selecciona el archivo manualmente.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto gap-2"
            size="lg"
          >
            <Upload className="h-4 w-4" />
            Seleccionar JSON
          </Button>
          <p className="text-xs text-muted-foreground">
            Formato soportado: .json (Array de objetos)
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </Card>
  );
};
