# EvaluaProf Scheduler (Desktop Module)

Este módulo implementa la versión de escritorio de EvaluaProf, centrada en la creación y optimización de horarios.

## Estructura

*   `src/desktop/`: Componentes y páginas exclusivas de la versión Web Desktop.
*   `src/mobile/`: (Pendiente de refactor) Componentes de la App móvil.
*   `src/adapters/`: Capa de traducción de datos (JSON sucio -> Schema limpio).
*   `src/types/canonical.ts`: Definiciones de tipos oficiales del sistema.

## Cómo probar

1.  Ejecuta `npm run dev`.
2.  Abre `http://localhost:5173/desktop` en tu navegador.
3.  Deberías ver el "Visualizador de Semestre" con datos de prueba cargados desde `src/mocks/raw-schedule.json`.

## Desarrollo

### Agregar nuevos componentes
Usa `src/desktop/components` para componentes visuales. Si es un componente genérico (botón, card simple), considera ponerlo en `src/components/ui` (shadcn) o `src/shared`.

### Modificar datos de prueba
Edita `src/mocks/raw-schedule.json`. El sistema se recargará automáticamente.
