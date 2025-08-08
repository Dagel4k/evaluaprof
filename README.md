# EvaluaProf - Monorepo

Este repositorio contiene:

- `faculty-pulse-app/`: Aplicación web (React + Vite + Capacitor Android)
- `scraper/`: Herramientas de scraping y generación de datos/ PDFs (Python)

## Requisitos generales

- Node.js 18+ (recomendado 20)
- npm 8+
- Python 3.9+

## Flujo de trabajo

1) Obtener/actualizar datos con el `scraper/` (opcional):

```bash
cd scraper
python -m venv .venv && source .venv/bin/activate  # en Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python setup.py  # instala playwright y dependencias
python run_scraper.py  # genera JSONs en scraper/out/profesores_enriquecido/
```

2) Construir la app web y empaquetar datos embebidos:

```bash
cd ../faculty-pulse-app
npm install --legacy-peer-deps
cp env.example .env  # opcional, para VITE_OPENAI_API_KEY
npm run build        # copia JSONs, build de producción y sync Android
```

3) Android (opcional):

```bash
npx cap open android       # abrir Android Studio
npm run android:debug      # generar APK debug por CLI
```

Consulta documentación específica dentro de cada carpeta:

- `faculty-pulse-app/README.md`
- `scraper/README.md`

# EvaluaProf - Sistema Avanzado de Análisis de Profesores Universitarios

Sistema completo e inteligente para analizar y evaluar profesores universitarios con **IA integrada**, **análisis avanzado** y **interfaz completamente responsive**.

## 🎯 Proyecto

EvaluaProf es una plataforma integral de nueva generación que permite:
- **Scraping automático** de 552 profesores del ITC con análisis enriquecido
- **Análisis de IA** usando OpenAI GPT-4 para insights detallados y personalizados  
- **Análisis avanzado** con métricas de confiabilidad, sentimiento y tendencias
- **Interfaz completamente responsive** optimizada para móviles, tablets y desktop
- **Gestión inteligente de errores** con visualización de archivos problemáticos
- **Carga progresiva** con contador en tiempo real de archivos procesados

## 📁 Estructura del Proyecto

```
evaluaprof/
├── scraper/                           # Herramientas de scraping y análisis
│   ├── mis_profesores_scraper.py     # Scraper principal
│   ├── advanced_analysis.py          # Análisis avanzado con IA
│   ├── analysis_utils.py             # Utilidades de análisis
│   ├── run_advanced_analysis.py      # Ejecutor de análisis
│   ├── profesores_json/              # Datos originales (552 archivos)
│   ├── out/profesores_enriquecido/   # Datos procesados con análisis
│   ├── requirements.txt              # Dependencias Python
│   └── README_ANALISIS_AVANZADO.md   # Documentación del análisis
├── faculty-pulse-app/                # Aplicación web React + TypeScript
│   ├── src/
│   │   ├── components/               # Componentes UI
│   │   │   ├── ErrorProfessors.tsx   # Gestión de errores
│   │   │   ├── ProfessorCard.tsx     # Tarjetas responsive
│   │   │   ├── AIAnalysisModal.tsx   # Modal de análisis IA
│   │   │   └── ui/                   # Componentes shadcn/ui
│   │   ├── services/
│   │   │   ├── professorLoader.ts    # Carga inteligente de datos
│   │   │   └── aiAnalysis.ts         # Integración OpenAI
│   │   ├── hooks/                    # React hooks personalizados
│   │   └── types/                    # Tipos TypeScript
│   ├── package.json
│   └── vite.config.ts                # Configuración con middleware
└── README.md                         # Este archivo
```

## 🚀 Características Principales

### 🔍 Sistema de Scraping Avanzado
- **Extracción masiva** de 552 profesores del ITC con datos completos
- **Análisis enriquecido** con métricas de confiabilidad y sentimiento
- **Procesamiento inteligente** que identifica y separa archivos con errores
- **Análisis NLP** para extracción de temas y sentimientos
- **Análisis Bayesiano** para métricas ajustadas por tiempo
- **Detección de tendencias** y pronósticos de calidad

### 🌐 Aplicación Web de Nueva Generación
- **Interfaz 100% responsive** optimizada para todos los dispositivos
- **Carga progresiva inteligente** con contador en tiempo real (552 archivos)
- **Gestión avanzada de errores** con sección dedicada para archivos problemáticos
- **Análisis de IA integrado** con OpenAI GPT-4 para insights personalizados
- **Filtros dinámicos** por departamento, calificación, confiabilidad y sentimiento
- **Visualizaciones avanzadas** con métricas de tendencias y pronósticos

### 🤖 Análisis de Inteligencia Artificial Integrado
- **Análisis completo por profesor** usando GPT-4 con contexto completo
- **Configuración de API Key** directamente en la interfaz
- **Análisis de sentimientos** automático de todas las reseñas
- **Métricas de confiabilidad** basadas en consistencia de datos
- **Pronósticos de calidad** usando análisis de tendencias
- **Identificación automática** de fortalezas y áreas de mejora

### 📱 Experiencia de Usuario Optimizada
- **Diseño Mobile-First** con breakpoints adaptativos
- **Carga inteligente por lotes** para optimizar rendimiento
- **Progreso visual** de carga con contadores de éxito y errores
- **Interfaz intuitiva** con componentes shadcn/ui modernos
- **Navegación fluida** entre vistas de lista y perfiles detallados

## 🛠️ Stack Tecnológico Avanzado

### Backend y Análisis
- **Python 3.9+** con análisis científico avanzado
- **Playwright** - Automatización web robusta
- **BeautifulSoup** - Parsing HTML inteligente
- **NLTK/TextBlob** - Procesamiento de lenguaje natural
- **NumPy/Pandas** - Análisis estadístico y bayesiano
- **Scikit-learn** - Machine learning para análisis de tendencias

### Frontend Moderno
- **React 18** con Hooks avanzados y Context API
- **TypeScript** - Tipado estático completo
- **Vite** - Build tool ultra-rápido con HMR
- **Tailwind CSS** - Framework CSS utility-first
- **shadcn/ui** - Sistema de componentes moderno
- **Lucide React** - Iconografía consistente
- **Framer Motion** - Animaciones fluidas

### IA y Servicios
- **OpenAI GPT-4** - Análisis de texto avanzado
- **API Key Management** - Configuración segura en cliente
- **Custom Middleware** - Servicio de archivos optimizado
- **Progressive Loading** - Carga optimizada por lotes

### Responsive Design
- **Mobile-First** - Diseño adaptativo desde móvil
- **Breakpoints inteligentes** - sm, md, lg, xl adaptativos
- **Flexbox/Grid** - Layouts modernos y flexibles
- **Truncation/Clamp** - Manejo inteligente de contenido

## 📊 Dataset Enriquecido (552 Profesores)

### 📋 Información Básica del Profesor
- **Nombre completo** y variaciones
- **Universidad** (Instituto Tecnológico de Culiacán)
- **Departamento/Facultad** con clasificación
- **Promedio general** (escala 1-10) con ajuste bayesiano
- **Porcentaje de recomendación** calculado inteligentemente
- **Dificultad promedio** (escala 1-5) con decay temporal
- **Número total de calificaciones** validado

### 🔬 Análisis Avanzado Integrado
- **Sentiment Score** (-1 a 1) usando NLP
- **Trust Score** (0-1) basado en consistencia de datos
- **Quality Trend** - Series temporales de calidad
- **Forecast Quality** - Predicción de calidad futura
- **Decay Analysis** - Métricas ajustadas por tiempo
- **Bayes Analysis** - Análisis bayesiano de calidad/dificultad

### 📝 Reseñas Enriquecidas
- **Fecha ISO** normalizada para análisis temporal
- **Materia** impartida con categorización
- **Calificación general** (1-10) validada
- **Comentario completo** procesado con NLP
- **Análisis de sentimientos** por reseña individual
- **Extracción de temas** automática

### ⚠️ Gestión de Errores
- **Archivos con errores** (~55) identificados automáticamente
- **Profesores sin reseñas** categorizados separadamente
- **Errores de carga** manejados graciosamente
- **Visualización clara** de problemas en la interfaz

## 🚀 Instalación y Configuración

### 1. Análisis Avanzado (Opcional)

```bash
cd scraper/
pip install -r requirements_analysis.txt
python run_advanced_analysis.py
```
*Genera archivos enriquecidos con análisis de IA y métricas avanzadas*

### 2. Aplicación Web Principal

```bash
cd faculty-pulse-app/
npm install
npm run dev
```
*La aplicación se ejecuta en http://localhost:8080 (una vez inicializado el proyecto evidentemente)*

### 3. Configuración de IA (En la Interfaz)

1. **Abrir la aplicación** en el navegador
2. **Hacer clic en "Configurar IA y Analizar"** en cualquier profesor
3. **Introducir tu API Key de OpenAI** en el modal que aparece
4. **La clave se guarda automáticamente** en localStorage del navegador

> 🔑 **Nota**: No necesitas configurar archivos .env, la API Key se gestiona directamente en la interfaz de usuario de forma segura.

## 📈 Flujo de Trabajo Inteligente

1. **Carga automática** de 552 archivos JSON enriquecidos
2. **Separación inteligente** de profesores válidos (497) y errores (55)
3. **Visualización progresiva** con contadores en tiempo real
4. **Navegación responsive** optimizada para cualquier dispositivo
5. **Análisis de IA personalizado** con configuración en interfaz
6. **Gestión transparente de errores** con sección dedicada

### 🎯 Experiencia de Usuario Típica

```
📱 Usuario abre la app
  ↓
⏳ Carga progresiva: "Procesados 125/552, ✓ Cargados: 95, ⚠ Errores: 30"
  ↓
📊 Vista principal: 497 profesores + sección de errores colapsible
  ↓
🔍 Filtros y búsqueda responsive
  ↓
👤 Selección de profesor → Perfil detallado
  ↓
🤖 Análisis IA → Modal con insights personalizados
```

## 🎨 Interfaz de Usuario Moderna

### 📱 Diseño Responsive Completo
- **Mobile-First** - Optimizado desde 320px hasta 4K
- **Breakpoints adaptativos** - sm (640px), lg (1024px), xl (1280px)
- **Layout fluido** - Columnas que se adaptan automáticamente
- **Texto escalable** - Fuentes que se ajustan por dispositivo
- **Iconos adaptativos** - Tamaños que cambian según pantalla

### 🎯 Componentes Inteligentes
- **Tarjetas de profesores** con información condensada en móvil
- **Modal de IA** completamente responsive
- **Sección de errores** colapsible con grid adaptativo
- **Paginación inteligente** - Iconos en móvil, texto completo en desktop
- **Filtros dinámicos** que se reorganizan según el espacio

### ✨ Experiencia Visual
- **Animaciones fluidas** con hover effects
- **Iconografía consistente** con Lucide React
- **Sistema de colores** coherente con Tailwind CSS
- **Feedback visual** inmediato en todas las interacciones
- **Estados de carga** con spinners y contadores

## 📊 Funcionalidades Principales

### 🏠 Dashboard Inteligente
- **Vista de 497 profesores válidos** con grid responsive
- **Sección de errores colapsible** mostrando 55 archivos problemáticos
- **Estadísticas en tiempo real** durante la carga
- **Búsqueda instantánea** por nombre, universidad o departamento
- **Filtros avanzados** por calidad, dificultad, sentimiento y confiabilidad

### 👨‍🏫 Perfil de Profesor Enriquecido
- **Métricas avanzadas** con análisis bayesiano y de sentimientos
- **Indicadores visuales** de confiabilidad y tendencias
- **Pronósticos de calidad** basados en análisis temporal
- **Reseñas procesadas** con NLP y análisis de temas
- **Botón de análisis IA** con modal dedicado

### 🤖 Análisis de IA Personalizado
- **Modal responsive** con configuración de API Key
- **Análisis completo** usando GPT-4 con contexto del profesor
- **Insights detallados** sobre fortalezas y debilidades
- **Recomendaciones específicas** para estudiantes
- **Gestión segura** de credenciales en el cliente

## 🔧 Configuración Avanzada

### Scraper
- **Delays personalizables** entre solicitudes
- **Selectores CSS** configurables
- **Timeouts** ajustables
- **User-Agents** rotativos

### Aplicación Web
- **Variables de entorno** para configuración
- **Temas personalizables** con Tailwind
- **Componentes modulares** reutilizables
- **Optimización** de rendimiento

## 📝 Formato de Datos Enriquecido

### JSON Individual Enriquecido
```json
{
  "nombre": "Jesús Manuel Acosta Mejía",
  "universidad": "Instituto Tecnológico de Culiacán",
  "departamento": "Metal-Mecánica",
  "n_reviews": 34,
  
  // Análisis avanzado integrado
  "decay_analysis": {
    "quality_decayed": 8.2,
    "difficulty_decayed": 3.2
  },
  "bayes_analysis": {
    "quality_bayes": 8.1,
    "difficulty_bayes": 3.3
  },
  "nlp_analysis": {
    "sentiment": {
      "overall": 0.3,
      "positive_ratio": 0.65
    },
    "topics": [
      {"words": ["exigente", "justo"], "weight": 0.8}
    ]
  },
  "integrity_analysis": {
    "trust_score": 0.85
  },
  "trends_analysis": {
    "quality_trend": {"series": [7.8, 8.0, 8.2, 8.1]},
    "forecast": {"quality_next": 8.3}
  },
  "recommendation_analysis": {
    "rate": 0.73
  },
  
  // Reseñas procesadas
  "reviews_public": [
    {
      "fecha_iso": "2023-05-15T00:00:00Z",
      "materia": "Resistencia de Materiales",
      "calidad": 8,
      "dificultad": 3,
      "comentario": "Excelente profesor, muy claro...",
      "sentiment_score": 0.4
    }
  ]
}
```

### JSON con Errores
```json
{
  "professor_id": "profesor_sin_datos",
  "error": "No hay reseñas disponibles"
}
```

### Estructura de Carga en la App
```typescript
interface LoadResult {
  professors: Professor[];  // 497 profesores válidos
  errors: ProfessorError[]; // 55 archivos con errores
}
```

## 🛡️ Seguridad y Rendimiento

### 🔒 Gestión Segura de Datos
- **API Keys en cliente** - Almacenadas en localStorage, nunca en servidor
- **Carga por lotes optimizada** - Máximo 5 archivos concurrentes
- **Manejo gracioso de errores** - 55 archivos problemáticos identificados
- **Validación robusta** - Todos los datos se validan antes de mostrar
- **Delays inteligentes** - Pausas entre lotes para no sobrecargar

### ⚡ Optimizaciones de Rendimiento
- **Progressive loading** - Carga visible del progreso
- **Lazy loading** - Componentes se cargan según necesidad
- **Responsive images** - Iconos adaptativos por dispositivo
- **Efficient rendering** - React optimizado con hooks y context
- **Smart caching** - Datos se mantienen en memoria durante la sesión

## 🎯 Casos de Uso

### 👨‍🎓 Para Estudiantes
- **Selección informada** de profesores antes de inscribirse
- **Análisis de IA personalizado** para entender el estilo de enseñanza
- **Comparación de métricas** entre diferentes opciones
- **Visualización de tendencias** para ver evolución del profesor

### 👨‍🏫 Para Profesores
- **Autoanálisis** de su perfil público y reseñas
- **Identificación de fortalezas** y áreas de mejora
- **Comparación con colegas** del mismo departamento
- **Insights de IA** sobre percepción estudiantil

### 🏫 Para Instituciones
- **Análisis departamental** completo
- **Identificación de profesores destacados**
- **Métricas de satisfacción** estudiantil
- **Tendencias de calidad** educativa

## 📊 Estadísticas del Proyecto

- **552 archivos JSON** procesados automáticamente
- **497 profesores válidos** con datos completos
- **55 archivos con errores** manejados graciosamente
- **100% responsive** - Funciona desde 320px hasta 4K
- **Análisis de IA integrado** con OpenAI GPT-4
- **Métricas avanzadas** con NLP y análisis bayesiano

## 🤝 Contribuciones y Mejoras

### 🔧 Áreas de Mejora Técnica
- **Nuevos análisis** - Implementar más métricas de IA
- **Más universidades** - Extender el scraper a otros sitios
- **Visualizaciones avanzadas** - Gráficos interactivos con D3.js
- **PWA completa** - Funcionalidad offline

### 🎨 Mejoras de UX/UI
- **Temas personalizables** - Modo oscuro/claro
- **Animaciones avanzadas** - Transiciones más fluidas
- **Accesibilidad mejorada** - Soporte completo para lectores de pantalla
- **Internacionalización** - Soporte multiidioma

## 📄 Licencia y Uso Responsable

Este proyecto es **open source** para uso educativo y de investigación. 

⚠️ **Importante**: 
- Respeta los términos de servicio de los sitios web
- Usa los datos de forma ética y responsable
- No hagas scraping masivo sin permisos
- Los análisis de IA son orientativos, no definitivos
