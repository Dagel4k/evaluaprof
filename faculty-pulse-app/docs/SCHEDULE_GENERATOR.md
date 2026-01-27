# Generador de Todas las Combinaciones de Horarios

Este script genera **TODAS** las combinaciones posibles de horarios, desde 7 materias hasta 1 materia, y las ordena objetivamente por facilidad.

## 📋 Características

- ✅ Genera **todas** las combinaciones posibles (producto cartesiano completo)
- ✅ Detecta conflictos de horario automáticamente
- ✅ Ordena por facilidad (dificultad promedio más baja)
- ✅ Genera reporte detallado en texto plano
- ✅ Exporta datos completos en JSON
- ✅ Muestra TOP 50 horarios más fáciles sin conflictos

## 🚀 Uso

### Opción 1: Con tsx (recomendado)

```bash
npx tsx generate-all-schedules.ts
```

### Opción 2: Compilar y ejecutar

```bash
npx tsc generate-all-schedules.ts
node generate-all-schedules.js
```

## 📊 Criterios de Ordenamiento

Los horarios se ordenan **objetivamente** usando los siguientes criterios:

### 1. **Prioridad: Sin Conflictos**
- Los horarios sin conflictos de horario aparecen primero
- Un conflicto ocurre cuando dos clases se solapan en el mismo día y hora

### 2. **Facilidad: Dificultad Promedio Más Baja**
- Se calcula el promedio de dificultad de todos los profesores
- Dificultad basada en evaluaciones de EvaluaProf (escala 1-10)
- **Menor dificultad = Horario más fácil**

### Fórmula

```
Dificultad Promedio = Σ(Dificultad de cada profesor) / Número de materias
```

### Ejemplo

Si tienes 5 materias con dificultades: `3, 4, 2, 5, 3`

```
Dificultad Promedio = (3 + 4 + 2 + 5 + 3) / 5 = 3.4/10
```

Un horario con dificultad promedio de **3.4** es más fácil que uno con **5.2**.

## 📁 Archivos Generados

### 1. `schedule-combinations-report.txt`
Reporte en texto plano con:
- Estadísticas generales
- Distribución por número de materias
- TOP 50 horarios más fáciles sin conflictos
- Explicación detallada de criterios

### 2. `schedule-combinations.json`
Datos completos en JSON con todas las combinaciones, incluyendo:
- Grupos seleccionados
- Dificultad total y promedio
- Número de materias
- Conflictos detectados
- Detalles de cada conflicto

## 📈 Complejidad Computacional

⚠️ **ADVERTENCIA**: Este script genera **TODAS** las combinaciones posibles.

Si tienes:
- 10 materias con 5 grupos cada una = **9,765,625** combinaciones de 7 materias
- El número total puede ser **muy grande**

### Estimación de Tiempo

- **Pocos grupos**: Segundos a minutos
- **Muchos grupos**: Minutos a horas
- **Demasiados grupos**: Puede requerir optimización

## 🔍 Interpretación de Resultados

### Dificultad Promedio
- **1.0 - 3.0**: Muy fácil ✅
- **3.1 - 5.0**: Fácil 👍
- **5.1 - 7.0**: Moderado ⚠️
- **7.1 - 9.0**: Difícil 🔥
- **9.1 - 10.0**: Muy difícil ❌

### Sin Conflictos
- ✅ **Sin conflictos**: Horario viable
- ❌ **Con conflictos**: Horario imposible (clases se solapan)

## 💡 Ejemplo de Salida

```
🏆 TOP 10 HORARIOS MÁS FÁCILES (SIN CONFLICTOS):

1. Dificultad Promedio: 2.4/10
   Materias (5):
   - ALGEBRA LINEAL (gA) - Prof: CARLOS CAMACHO - Dif: 2.0
   - BASES DE DATOS (gB) - Prof: MARIA MARTINEZ - Dif: 1.5
   - PROGRAMACION (gC) - Prof: JUAN LOPEZ - Dif: 3.0
   - CALCULO (gA) - Prof: PEDRO GARCIA - Dif: 2.5
   - FISICA (gD) - Prof: ANA RODRIGUEZ - Dif: 3.0

2. Dificultad Promedio: 2.6/10
   ...
```

## 🛠️ Personalización

### Cambiar Rango de Materias

Edita las líneas 110-111:

```typescript
// De 7 a 1 materias
for (let numSubjects = 7; numSubjects >= 1; numSubjects--) {
```

Cambia a:

```typescript
// De 6 a 3 materias (ejemplo)
for (let numSubjects = 6; numSubjects >= 3; numSubjects--) {
```

### Cambiar Número de Top Resultados

Edita la línea 186:

```typescript
const top50 = combinations.filter(c => !c.hasConflicts).slice(0, 50);
```

Cambia `50` al número deseado.

## ⚡ Optimizaciones Futuras

Si el script es muy lento, considera:

1. **Filtrar por materias específicas** antes de generar combinaciones
2. **Limitar el número de grupos por materia**
3. **Usar paralelización** con worker threads
4. **Implementar poda temprana** (early pruning) de combinaciones inviables

## 📝 Notas

- La dificultad se simula usando un hash del nombre del profesor
- En producción, conectar con la base de datos real de EvaluaProf
- El script asume que `message.json` está en `public/message.json`
