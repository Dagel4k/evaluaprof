# EvaluaProf Scheduler: Documento de Arquitectura y Ejecución

## A) Arquitectura y Componentes

La arquitectura será **Client-Side Heavy (SPA)**. El procesamiento pesado (combinatoria de horarios) ocurre en el navegador del usuario para ahorrar costos de servidor y garantizar privacidad/velocidad inmediata.

### 1. Diagrama de Capas

1.  **Capa de Ingesta (Adapters):**
    *   Recibe datos sucios (JSON horario cargado, entrada manual de usuario, futuro JSON oficial).
    *   Responsabilidad: Transformar cualquier input al *Schema Canónico*.
2.  **Capa de Estado (Zustand/Context):**
    *   `CourseStore`: Catálogo de materias disponibles.
    *   `ProfessorStore`: Tu dataset actual enriquecido (cacheado en IndexedDB/LocalStorage).
    *   `SessionStore`: Horario en construcción del usuario.
3.  **Capa de Dominio (Core Logic - Web Worker):**
    *   *Scheduler Engine:* Algoritmo de generación de horarios.
    *   *Conflict Detector:* Lógica booleana de choques.
    *   *Scoring System:* Calcula el "Score EvaluaProf" de un horario basado en tus métricas.
4.  **Capa de UI (React Desktop):**
    *   Componentes densos (Grid de calendario, Tablas comparativas).
    *   Visualización de datos (D3.js o Recharts para comparar profesores).

### 2. Infraestructura

*   **Frontend:** React + Vite + TypeScript (Mantener en `faculty-pulse-app` pero crear nuevas rutas desktop-first o un nuevo entry point).
*   **Backend (Mínimo viable):**
    *   **Fase 1-3:** No necesario. Todo es `localStorage` y exportación de archivos JSON.
    *   **Fase 4 (Monetización):** Supabase (Auth + DB Postgres). Es lo más rápido para manejar usuarios, roles (Free/Premium) y guardar configuraciones.
*   **Persistencia Local:** `IndexedDB` (vía `idb-keyval`) para guardar el dataset de 500+ profesores y que la carga sea instantánea.

### 3. Estrategia de Datos Inicial

Usaremos el **JSON de "horario ya cargado"** como semilla.
*   *Problema:* Ese JSON representa una *selección* (1 grupo por materia), no la *oferta* (N grupos por materia).
*   *Solución:* El sistema tratará ese JSON como una "Oferta de 1 sola opción". Esto permite desarrollar y probar la UI de visualización y el calculador de métricas inmediatamente, aunque el scheduler automático no tenga opciones para permutar todavía.

---

## B) Schema Canónico

Este es el contrato de datos. Todo adaptador debe escupir esto.

```typescript
// Entidades Base

type TimeSlot = {
  day: 'L' | 'M' | 'I' | 'J' | 'V' | 'S';
  startTime: number; // Minutos desde 00:00 (ej: 420 para 7:00 AM)
  endTime: number;   // Minutos desde 00:00
  classroom?: string;
};

// El bloque atómico de elección
type CourseGroup = {
  id: string;             // UUID único generado
  subjectId: string;      // FK a Subject
  subjectName: string;    // Desnormalizado para UI rápida
  groupCode: string;      // Ej: "001", "002"
  professorIds: string[]; // Array porque a veces comparten curso, FK a tu dataset
  professorNames: string[]; // Desnormalizado (clave para machear con tu dataset actual)
  schedule: TimeSlot[];
};

type Subject = {
  id: string;
  code: string; // Clave materia
  name: string;
  groups: CourseGroup[]; // Todas las opciones disponibles para esta materia
};

// Metadata del Profesor (Tu dataset enriquecido)
type ProfessorMetrics = {
  id: string;
  name: string;
  globalScore: number;
  difficulty: number;
  takeAgainPercent: number;
  tags: string[];
  // Campos calculados por tu scraper
  sentimentScore: number; 
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
};
```

---

## C) Roadmap por Fases

### Fase 0: Cimientos (Semana 1)
*   **Objetivo:** Tener el schema y los datos falsos listos.
*   **Tareas:**
    1.  Definir interfaces TypeScript del Schema Canónico.
    2.  Crear `AdapterLoadJSON`: Transforma el JSON de "horario cargado" al Schema Canónico.
    3.  Crear `MockDataGenerator`: Script que toma una materia real y genera 5 grupos ficticios con diferentes horarios y profesores de tu dataset (para probar choques y permutaciones).
*   **Entregable:** Un script que corre `npm run generate-mocks` y escupe un `offering.json` válido.

### Fase 1: El Visualizador "Inteligente" (MVP Gratis)
*   **Objetivo:** Que el usuario vea su horario actual pero con *analytics* de EvaluaProf.
*   **Features:**
    *   Importar JSON (drag & drop).
    *   Grid de Horario (Lunes a Viernes).
    *   **Professor Cards:** Al hacer hover en una clase, muestra tus métricas (Quality, Difficulty, Sentiment) y el "Veredicto AI" (resumen corto).
    *   Cálculo de métricas del horario completo: "Dificultad Promedio del Semestre", "Probabilidad de Aprobar".
*   **UI:** Dashboard denso. Sidebar con materias, Main con calendario.
*   **Métrica Éxito:** Usuarios importan su JSON y comparten captura de pantalla de su "Análisis de Semestre".

### Fase 2: Constructor Manual (La Herramienta)
*   **Objetivo:** Permitir al usuario crear horarios desde cero (Ingesta Manual).
*   **Features:**
    *   **Formulario "Agregar Materia":** El usuario escribe el nombre y agrega manualmente los grupos que ve en el portal de la universidad (ya que no tenemos scraping live).
    *   Detector de Choques en tiempo real (Visual: rojo si se solapa).
    *   Comparador "Side-by-Side": Seleccionar 2 grupos de la misma materia y ver métricas de profesores cara a cara.
*   **Riesgo:** La fricción de meter datos manuales. Se mitiga con un UX muy rápido (tab key navigation).

### Fase 3: El "Genie" Automático (Web Worker)
*   **Objetivo:** Generar el mejor horario posible matemáticamente.
*   **Tecnología:** Web Workers para no congelar la UI.
*   **Features:**
    *   Botón "Generar Horarios".
    *   Filtros: "Bloquear mañanas", "Maximizar Calidad de Profes", "Minimizar Huecos".
    *   Lista de resultados: "Top 10 Horarios" ordenados por Score.
*   **Entregable:** El algoritmo de backtracking funcionando en cliente.

### Fase 4: Monetización y Cuentas
*   **Objetivo:** Cobrar.
*   **Integración:** Supabase Auth + Stripe (o manual payment links iniciales).
*   **Gating:** Bloquear el acceso a la Fase 3 (Generador) y métricas avanzadas a usuarios Free.

---

## D) Diseño del Motor de Horarios (The Engine)

El motor debe ejecutarse en un **Web Worker** dedicado.

**Algoritmo: Depth-First Search (DFS) con Poda (Backtracking)**

1.  **Input:** Lista de `Subjects`, cada una con N `Groups`.
2.  **Constraints (Hard):**
    *   No solapamiento de `TimeSlots`.
    *   Materia obligatoria (si el usuario la marcó así).
3.  **Heurísticas (Soft - Score):**
    *   `Score = (AvgProfQuality * 0.6) + (ScheduleCompactness * 0.2) + (FreeDays * 0.2)`
    *   *Compactness:* Penaliza huecos de > 1 hora entre clases.
4.  **Optimización:**
    *   Ordenar materias de *menos* opciones a *más* opciones (fail-fast).
    *   **Early Stopping:** Si encontramos 50 horarios válidos, paramos y devolvemos los Top 10. No necesitamos encontrar las 10,000 combinaciones.

**Explicabilidad:**
El UI debe mostrar etiquetas en los resultados: *"⭐ Mejor Calidad Académica"*, *"📅 Viernes Libre"*, *"⚡ Más equilibrado"*.

---

## E) Monetización Concreta

**Modelo:** Freemium agresivo.

**Plan FREE (El Gancho):**
*   Visualizador de horarios (Manual builder).
*   Ver métricas básicas de profesores (Calificación global).
*   Detección de choques.

**Plan PRO (El Solucionador - $3 USD / semestre o $10 Lifetime):**
*   **Generador Automático:** "Danos tus materias, te damos los 3 mejores horarios".
*   **Métricas Avanzadas:** Acceso al "Nivel de Riesgo", "Sentiment Analysis" y gráficas de dificultad histórica.
*   **Guardar Horarios:** Nube (Supabase).
*   **Export:** A Google Calendar / ICS.

**El Data Flywheel (Gating por Evaluación):**
Para desbloquear funciones "Pro Lite" sin pagar, el usuario debe completar 3 evaluaciones de sus profesores anteriores.
*   *Implementación:* Un modal que intercepta: "Para ver el análisis de sentimiento de este profesor, aporta tu review de tus profesores pasados".
*   Esto llena tu DB para el siguiente semestre.

---

## F) Checklist de Implementación (Operativo)

Para empezar ya, divide el trabajo así:

**Track A: Core & Data (Backend/Logic)**
1.  [ ] Definir interfaces TypeScript en `src/types/canonical.ts`.
2.  [ ] Crear script `mock-generator.ts` que genere un JSON con la estructura canónica y datos inventados pero coherentes.
3.  [ ] Implementar `ProfessorRepository` en el frontend que cargue tu JSON de 552 profes a memoria.
4.  [ ] Escribir la función pura `calculateScheduleScore(schedule)` (lógica matemática de puntuación).
5.  [ ] Crear el esqueleto del Web Worker para el scheduler.

**Track B: UI & Experience (Frontend)**
1.  [ ] Configurar React Router para nuevas vistas `/desktop/builder`.
2.  [ ] Crear componente `TimeGrid`: Una tabla CSS Grid que pinte bloques de clases basado en `startTime`/`endTime`.
3.  [ ] Crear componente `CourseInput`: Input con autocompletado para buscar materias (aunque sea manual al inicio).
4.  [ ] Implementar el Drag & Drop básico o selección de grupos.
5.  [ ] Integrar Tailwind para un diseño denso (textos pequeños, mucha info en pantalla).

**Primer paso recomendado:**
Ejecuta la **Fase 0**. Crea el adaptador para que tu JSON actual (`prueba.json`) se visualice en una grilla web simple. Eso valida que puedes pintar datos reales.
