# EvaluaProf - Sistema de Análisis de Profesores Universitarios

Sistema completo para analizar y evaluar profesores universitarios, incluyendo una aplicación web y herramientas de scraping.

## 🎯 Proyecto

EvaluaProf es una plataforma integral que permite:
- **Scraping automático** de datos de profesores desde sitios web
- **Análisis de datos** con visualizaciones interactivas
- **Análisis de IA** usando ChatGPT para insights detallados
- **Gestión de datos** en formato JSON estándar

## 📁 Estructura del Proyecto

```
Profesores/
├── scraper/                    # Herramientas de scraping
│   ├── mis_profesores_scraper.py
│   ├── process_data.py
│   ├── run_scraper.py
│   ├── test_scraper.py
│   ├── setup.py
│   ├── requirements.txt
│   └── README.md
├── faculty-pulse-app/          # Aplicación web React
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── README.md
├── prueba.json                 # Datos de ejemplo
└── README.md                   # Este archivo
```

## 🚀 Características Principales

### 🔍 Scraper de Mis Profesores
- **Extracción automática** de ~584 profesores del ITC
- **Paginación inteligente** que detecta todas las páginas
- **Datos completos**: nombre, departamento, calificaciones, reseñas
- **Formato JSON estándar** compatible con la aplicación web
- **Delays aleatorios** para evitar bloqueos
- **Manejo de errores** robusto

### 🌐 Aplicación Web (EvaluaProf)
- **Interfaz moderna** con React + TypeScript
- **Visualizaciones interactivas** con gráficos y nubes de palabras
- **Análisis de IA** integrado con ChatGPT
- **Filtros avanzados** por departamento, calificación, dificultad
- **Carga de archivos** JSON individuales o múltiples
- **Diseño responsive** para móviles y desktop

### 🤖 Análisis de Inteligencia Artificial
- **Análisis detallado** de cada profesor
- **Identificación de fortalezas y debilidades**
- **Recomendaciones personalizadas**
- **Análisis de tendencias** en las reseñas
- **Insights sobre metodología de enseñanza**

## 🛠️ Tecnologías Utilizadas

### Scraper
- **Python 3.9+**
- **Playwright** - Navegación web automatizada
- **BeautifulSoup** - Parsing de HTML
- **Fake UserAgent** - Rotación de User-Agents

### Aplicación Web
- **React 18** - Framework frontend
- **TypeScript** - Tipado estático
- **Vite** - Build tool rápido
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **Recharts** - Gráficos interactivos
- **React Wordcloud** - Nubes de palabras

### IA y APIs
- **OpenAI GPT-4/3.5** - Análisis de texto
- **REST APIs** - Comunicación con servicios externos

## 📊 Datos Extraídos

### Información del Profesor
- **Nombre completo**
- **Universidad** (Instituto Tecnológico de Culiacán)
- **Departamento/Facultad**
- **Promedio general** (escala 1-10)
- **Porcentaje de recomendación**
- **Dificultad promedio** (escala 1-5)
- **Número total de calificaciones**
- **Lista de etiquetas** (características)

### Reseñas Detalladas
- **Fecha** de la reseña
- **Materia** impartida
- **Calificación general** (escala 1-10)
- **Comentario completo** del estudiante

## 🚀 Instalación y Uso

### 1. Scraper

```bash
cd scraper/
python3 setup.py
python3 run_scraper.py
```

### 2. Aplicación Web

```bash
cd faculty-pulse-app/
npm install --legacy-peer-deps
npm run dev
```

### 3. Configuración de IA

1. Crear archivo `.env` en `faculty-pulse-app/`
2. Agregar tu API key de OpenAI:
```
VITE_OPENAI_API_KEY=tu_api_key_aqui
```

## 📈 Flujo de Trabajo

1. **Extracción de datos** con el scraper
2. **Procesamiento** y validación de datos
3. **Carga** en la aplicación web
4. **Análisis visual** con gráficos y estadísticas
5. **Análisis de IA** para insights detallados
6. **Exportación** de resultados

## 🎨 Características de la UI

- **Tema oscuro/claro** automático
- **Animaciones suaves** y transiciones
- **Iconografía moderna** con Lucide React
- **Layout responsive** para todos los dispositivos
- **Accesibilidad** con navegación por teclado
- **PWA** - Instalable como aplicación

## 📱 Funcionalidades Principales

### Dashboard
- **Vista general** de todos los profesores
- **Estadísticas** en tiempo real
- **Filtros rápidos** por departamento
- **Búsqueda** por nombre

### Perfil del Profesor
- **Información detallada** con métricas
- **Gráficos de rendimiento** por materia
- **Nube de etiquetas** características
- **Lista de reseñas** con filtros
- **Análisis de IA** con ChatGPT

### Análisis Comparativo
- **Comparación** entre profesores
- **Rankings** por diferentes métricas
- **Tendencias** temporales
- **Análisis de departamentos**

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

## 📝 Formato de Datos

### JSON Individual
```json
{
  "nombre": "Jesús Manuel Acosta Mejía",
  "universidad": "Instituto Tecnológico de Culiacán",
  "departamento": "Metal-Mecánica",
  "promedio_general": 8.2,
  "porcentaje_recomienda": 73,
  "dificultad_promedio": 3.2,
  "etiquetas": ["muchas tareas", "pocos exámenes"],
  "numero_calificaciones": 34,
  "calificaciones": [...]
}
```

### JSON Combinado
```json
{
  "metadata": {
    "generated_at": "2024-01-15T10:30:00",
    "total_professors": 584,
    "university": "Instituto Tecnológico de Culiacán"
  },
  "statistics": {...},
  "professors": [...]
}
```

## 🛡️ Seguridad y Privacidad

- **Delays aleatorios** para evitar bloqueos
- **User-Agents rotativos** para simular navegadores reales
- **Manejo de errores** robusto
- **Validación de datos** antes del procesamiento
- **API keys** seguras en variables de entorno

## 🤝 Contribución

### Para el Scraper
1. Mejorar selectores CSS
2. Agregar soporte para más universidades
3. Optimizar rendimiento
4. Mejorar manejo de errores

### Para la Aplicación Web
1. Agregar nuevas visualizaciones
2. Mejorar UX/UI
3. Implementar nuevas funcionalidades
4. Optimizar rendimiento

## 📄 Licencia

Este proyecto es para uso educativo y de investigación. Respeta los términos de servicio de los sitios web que se scrapean.

## 📞 Soporte

Para problemas o mejoras:
- Revisar logs de error
- Verificar configuración
- Probar con diferentes selectores
- Consultar la documentación específica de cada componente

---

**Desarrollado para análisis académico y mejora de la educación universitaria** 