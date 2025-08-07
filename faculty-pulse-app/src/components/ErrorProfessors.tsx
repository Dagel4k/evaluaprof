import React, { useState } from 'react';
import { ProfessorError } from '@/types/professor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertTriangle, FileX } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ErrorProfessorsProps {
  errors: ProfessorError[];
}

export const ErrorProfessors: React.FC<ErrorProfessorsProps> = ({ errors }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (errors.length === 0) {
    return null;
  }

  // Agrupar errores por tipo
  const errorGroups = errors.reduce((groups, error) => {
    const errorType = error.error;
    if (!groups[errorType]) {
      groups[errorType] = [];
    }
    groups[errorType].push(error);
    return groups;
  }, {} as Record<string, ProfessorError[]>);

  return (
    <Card className="mt-4 sm:mt-6 border-orange-200 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors p-3 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-orange-800 text-sm sm:text-base truncate">
                    Profesores con Errores ({errors.length})
                  </CardTitle>
                  <CardDescription className="text-orange-600 text-xs sm:text-sm hidden sm:block">
                    Archivos que no pudieron ser procesados correctamente
                  </CardDescription>
                  <CardDescription className="text-orange-600 text-xs sm:hidden">
                    Archivos con errores
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-orange-600 hover:text-orange-700 shrink-0 p-1 sm:p-2"
              >
                {isOpen ? (
                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(errorGroups).map(([errorType, errorList]) => (
                <div key={errorType} className="border border-orange-200 rounded-lg p-3 sm:p-4 bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <FileX className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 shrink-0" />
                      <h4 className="font-medium text-orange-800 text-sm sm:text-base truncate">
                        {errorType}
                      </h4>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs sm:text-sm w-fit">
                      {errorList.length} archivo{errorList.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                    {errorList.map((error) => (
                      <div
                        key={error.professor_id}
                        className="p-2 sm:p-3 bg-orange-50 rounded border border-orange-100 text-xs sm:text-sm"
                      >
                        <div className="font-mono text-orange-800 truncate" title={error.professor_id}>
                          {error.professor_id}
                        </div>
                        {error.filename && (
                          <div className="text-xs text-orange-600 mt-1 truncate" title={error.filename}>
                            {error.filename}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-orange-100 rounded-lg">
              <p className="text-xs sm:text-sm text-orange-700 leading-relaxed">
                <strong>Nota:</strong> Estos archivos contienen errores o datos incompletos y no aparecen en la lista principal de profesores.
                <span className="hidden sm:inline"> La mayoría son casos donde no hay reseñas disponibles para el profesor.</span>
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
