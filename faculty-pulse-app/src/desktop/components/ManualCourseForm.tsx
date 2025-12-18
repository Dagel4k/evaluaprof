import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card } from '@/shared/ui/card';
import { Plus, Trash2, Clock, Save } from 'lucide-react';
import { CourseGroup, DayOfWeek, TimeSlot } from '../../types/canonical';
import { v4 as uuidv4 } from 'uuid';

interface ManualCourseFormProps {
  onSave: (subjectName: string, groups: CourseGroup[]) => void;
  onCancel: () => void;
}

const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'L', label: 'L' },
  { id: 'M', label: 'M' },
  { id: 'I', label: 'Mier' },
  { id: 'J', label: 'J' },
  { id: 'V', label: 'V' },
];

export const ManualCourseForm: React.FC<ManualCourseFormProps> = ({ onSave, onCancel }) => {
  const [subjectName, setSubjectName] = useState('');
  const [groups, setGroups] = useState<Partial<CourseGroup>[]>([
    { id: uuidv4(), groupCode: '001', professorNames: [''], schedule: [] }
  ]);

  const addGroup = () => {
    setGroups([...groups, { id: uuidv4(), groupCode: `00${groups.length + 1}`, professorNames: [''], schedule: [] }]);
  };

  const removeGroup = (index: number) => {
    setGroups(groups.filter((_, i) => i !== index));
  };

  const updateGroup = (index: number, data: Partial<CourseGroup>) => {
    const newGroups = [...groups];
    newGroups[index] = { ...newGroups[index], ...data };
    setGroups(newGroups);
  };

  const addSlot = (groupIndex: number) => {
    const newGroups = [...groups];
    const group = newGroups[groupIndex];
    group.schedule = [...(group.schedule || []), { day: 'L', startTime: 420, endTime: 480 }];
    setGroups(newGroups);
  };

  const updateSlot = (groupIndex: number, slotIndex: number, data: Partial<TimeSlot>) => {
    const newGroups = [...groups];
    const group = newGroups[groupIndex];
    if (group.schedule) {
      group.schedule[slotIndex] = { ...group.schedule[slotIndex], ...data } as TimeSlot;
      setGroups(newGroups);
    }
  };

  const handleSave = () => {
    if (!subjectName) return;
    onSave(subjectName, groups as CourseGroup[]);
  };

  return (
    <Card className="p-6 space-y-6 bg-card text-card-foreground shadow-lg border border-border">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Agregar Materia Manualmente</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre de la Materia</label>
        <Input 
          placeholder="Ej: Cálculo Integral" 
          value={subjectName} 
          onChange={(e) => setSubjectName(e.target.value)}
          className="text-lg"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold text-muted-foreground">Grupos / Opciones</h4>
          <Button type="button" variant="outline" size="sm" onClick={addGroup} className="gap-2">
            <Plus className="h-4 w-4" /> Agregar Grupo
          </Button>
        </div>

        {groups.map((group, gIdx) => (
          <div key={group.id} className="p-4 border border-border rounded-lg bg-muted/30 space-y-4">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Código</label>
                <Input 
                  value={group.groupCode} 
                  onChange={(e) => updateGroup(gIdx, { groupCode: e.target.value })} 
                />
              </div>
              <div className="col-span-8">
                <label className="text-[10px] uppercase font-bold text-muted-foreground">Profesor</label>
                <Input 
                  placeholder="Nombre completo para vincular"
                  value={group.professorNames?.[0]} 
                  onChange={(e) => updateGroup(gIdx, { professorNames: [e.target.value] })} 
                />
              </div>
              <div className="col-span-1 flex items-end">
                <Button variant="ghost" size="icon" onClick={() => removeGroup(gIdx)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold">Horarios</span>
                <Button variant="ghost" size="sm" onClick={() => addSlot(gIdx)} className="h-7 text-xs gap-1">
                  <Clock className="h-3 w-3" /> Añadir Hora
                </Button>
              </div>

              {group.schedule?.map((slot, sIdx) => (
                <div key={sIdx} className="grid grid-cols-7 gap-2 items-center">
                  <select 
                    className="col-span-1 text-xs border border-input bg-background rounded p-1 h-9"
                    value={slot.day}
                    onChange={(e) => updateSlot(gIdx, sIdx, { day: e.target.value as DayOfWeek })}
                  >
                    {DAYS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                  
                  <Input 
                    type="time" 
                    className="col-span-3 h-9" 
                    defaultValue="07:00"
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      updateSlot(gIdx, sIdx, { startTime: h * 60 + m });
                    }}
                  />
                  <Input 
                    type="time" 
                    className="col-span-3 h-9"
                    defaultValue="08:00"
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      updateSlot(gIdx, sIdx, { endTime: h * 60 + m });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex gap-3">
        <Button className="flex-1 gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" /> Guardar Materia
        </Button>
      </div>
    </Card>
  );
};
