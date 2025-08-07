# Faculty Pulse - EvaluaProf

Una plataforma moderna para analizar y visualizar perfiles académicos de profesores universitarios con análisis de inteligencia artificial.

## Características

- 📊 **Análisis Visual**: Gráficos y estadísticas detalladas de calificaciones
- 🏷️ **Etiquetas**: Visualización de características comunes mediante word clouds
- 📈 **Métricas Clave**: Promedio general, porcentaje de recomendación, dificultad
- 🔍 **Filtros Avanzados**: Búsqueda y filtrado por múltiples criterios
- 🤖 **Análisis IA con ChatGPT**: Análisis inteligente y veredictos detallados
- 📱 **Responsive**: Interfaz adaptada para dispositivos móviles y desktop

## Formato de Datos

La aplicación acepta archivos JSON con el siguiente formato:

```json
{
  "nombre": "Nombre del Profesor",
  "universidad": "Nombre de la Universidad",
  "departamento": "Departamento",
  "promedio_general": 6.5,
  "porcentaje_recomienda": 59,
  "dificultad_promedio": 3.1,
  "etiquetas": ["etiqueta1", "etiqueta2"],
  "numero_calificaciones": 32,
  "calificaciones": [
    {
      "fecha": "03/Jul/2023",
      "materia": "Nombre de la Materia",
      "calificacion_general": 8.0,
      "comentario": "Comentario de la reseña"
    }
  ]
}
```

## Uso con prueba.json

La aplicación incluye soporte específico para el archivo `prueba.json`:

1. **Carga Automática**: Haz clic en "Cargar prueba.json" en la pantalla principal
2. **Análisis Completo**: Visualiza todas las métricas del profesor César Iván Abrajan Barraza
3. **Exploración Interactiva**: Navega por las reseñas, materias y estadísticas
4. **Análisis IA**: Obtén un veredicto detallado de ChatGPT sobre el profesor

### Datos de Ejemplo Incluidos

El archivo `prueba.json` contiene información detallada sobre:
- **Profesor**: César Iván Abrajan Barraza
- **Universidad**: Instituto Tecnológico de Culiacán
- **Departamento**: Metal-Mecánica
- **32 reseñas** con calificaciones y comentarios
- **8 etiquetas** características del profesor
- **4 materias** diferentes evaluadas

## Configuración de la API de ChatGPT

### 1. Obtener API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crea una cuenta o inicia sesión
3. Genera una nueva API key
4. Copia la clave (comienza con `sk-`)

### 2. Configurar Variables de Entorno

1. **Copia el archivo de ejemplo**:
   ```bash
   cp env.example .env
   ```

2. **Edita el archivo `.env`**:
   ```bash
   VITE_OPENAI_API_KEY=sk-tu_api_key_aqui
   ```

3. **Reinicia la aplicación** después de configurar la API key

### 3. Funcionalidades de IA Disponibles

Una vez configurada la API, tendrás acceso a:

- **Análisis Completo**: Evaluación detallada del profesor
- **Fortalezas y Debilidades**: Identificación de aspectos positivos y áreas de mejora
- **Recomendaciones**: Sugerencias específicas para estudiantes
- **Calificación IA**: Puntuación basada en análisis inteligente
- **Estilo de Enseñanza**: Descripción del método pedagógico
- **Consejos para Estudiantes**: Recomendaciones personalizadas

## Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd faculty-pulse-app

# Instalar dependencias
npm install --legacy-peer-deps

# Configurar variables de entorno
cp env.example .env
# Editar .env con tu API key de OpenAI

# Ejecutar en modo desarrollo
npm run dev
```

## Tecnologías Utilizadas

- **React 18** con TypeScript
- **Vite** para build y desarrollo
- **Tailwind CSS** para estilos
- **Shadcn/ui** para componentes
- **Recharts** para gráficos
- **React Wordcloud** para visualización de etiquetas
- **Lucide React** para iconos
- **OpenAI GPT-4** para análisis de IA

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base de UI
│   ├── ProfessorCard.tsx
│   ├── ProfessorList.tsx
│   ├── ProfessorProfile.tsx
│   ├── ProfessorFilters.tsx
│   ├── FileUploader.tsx
│   └── AIAnalysisModal.tsx
├── services/           # Servicios de API
│   └── aiAnalysis.ts   # Servicio de análisis de IA
├── pages/              # Páginas de la aplicación
├── types/              # Definiciones de TypeScript
├── hooks/              # Hooks personalizados
└── lib/                # Utilidades y configuraciones
```

## Funcionalidades Principales

### 1. Carga de Datos
- Soporte para archivos JSON individuales o múltiples
- Validación automática del formato de datos
- Manejo de errores con notificaciones

### 2. Visualización de Perfiles
- Tarjetas informativas con métricas clave
- Indicadores visuales de calificación y dificultad
- Alertas para calificaciones bajas

### 3. Análisis Detallado
- Gráfico de distribución de calificaciones
- Word cloud de etiquetas características
- Análisis por materia (cuando hay múltiples materias)
- Historial completo de reseñas

### 4. Análisis de Inteligencia Artificial
- **Análisis Completo**: Evaluación integral del profesor
- **Fortalezas y Debilidades**: Identificación de aspectos clave
- **Recomendaciones**: Sugerencias específicas y accionables
- **Calificación IA**: Puntuación basada en análisis inteligente
- **Estilo de Enseñanza**: Descripción del método pedagógico
- **Consejos para Estudiantes**: Recomendaciones personalizadas

### 5. Filtros y Búsqueda
- Filtrado por materia
- Rango de calificaciones
- Nivel de dificultad
- Búsqueda por nombre

## Uso de la API de IA

### Análisis Automático
1. Carga los datos del profesor
2. Haz clic en "Análisis IA" en el perfil
3. Espera a que ChatGPT procese los datos
4. Revisa el análisis completo con:
   - Resumen ejecutivo
   - Fortalezas y debilidades
   - Recomendaciones específicas
   - Calificación IA
   - Consejos para estudiantes

### Personalización
El análisis se adapta automáticamente a:
- El contexto de la universidad
- Las materias impartidas
- Las características específicas del profesor
- Los comentarios de los estudiantes

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request