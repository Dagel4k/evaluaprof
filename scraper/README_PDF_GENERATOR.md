# 📊 Generador de PDF para Evaluación de Profesores

Este generador crea un reporte profesional en PDF con todos los datos de evaluación de profesores del directorio `profesores_enriquecido`.

## 🌟 Características

### Diseño Profesional
- **Layout moderno** con colores corporativos
- **Tipografía clara** y legible
- **Encabezados y pies de página** consistentes
- **Gráficos y visualizaciones** de alta calidad

### Contenido Completo
- **Página de título** con estadísticas generales
- **Resumen ejecutivo** con análisis estadístico
- **Perfil individual** de cada profesor que incluye:
  - Métricas de calidad y recomendación
  - Análisis por materias impartidas
  - Tendencias de calidad temporal
  - Análisis de sentimiento
  - Temas principales en comentarios
  - Comentarios recientes destacados

### Análisis Avanzado
- **Distribuciones estadísticas** de calidad docente
- **Tasas de recomendación** por profesor
- **Análisis de confiabilidad** de las evaluaciones
- **Tendencias temporales** de rendimiento
- **Procesamiento de lenguaje natural** de comentarios

## 🚀 Instalación

### 1. Requisitos del Sistema
```bash
Python 3.8 o superior
```

### 2. Instalar Dependencias
```bash
cd scraper
pip install -r requirements_pdf.txt
```

### 3. Dependencias Principales
- `matplotlib` - Generación de gráficos y PDF
- `seaborn` - Visualizaciones estadísticas avanzadas
- `pandas` - Manipulación de datos
- `numpy` - Cálculos numéricos

## 📖 Uso

### Método 1: Script Interactivo (Recomendado)
```bash
python run_pdf_generator.py
```

Este script te guiará paso a paso:
1. Te preguntará por el directorio de datos
2. Te permitirá elegir el nombre del archivo de salida
3. Mostrará el progreso de generación
4. Confirmará la creación exitosa

### Método 2: Script Principal
```bash
python generate_professors_pdf.py
```

### Método 3: Uso Programático
```python
from generate_professors_pdf import ProfessorPDFGenerator

# Crear generador
generator = ProfessorPDFGenerator("out/profesores_enriquecido")

# Cargar datos
generator.load_professor_data()

# Generar PDF
generator.generate_pdf("mi_reporte.pdf")
```

## 📁 Estructura de Archivos

```
scraper/
├── generate_professors_pdf.py    # Script principal
├── run_pdf_generator.py          # Script interactivo
├── requirements_pdf.txt          # Dependencias
├── README_PDF_GENERATOR.md       # Esta documentación
└── out/
    └── profesores_enriquecido/   # Datos JSON de profesores
        ├── Profesor_1.json
        ├── Profesor_2.json
        └── ...
```

## 🎨 Personalización

### Colores del Tema
El generador utiliza un esquema de colores profesional:
- **Azul principal**: `#2E4A6B` - Títulos y elementos principales
- **Azul secundario**: `#4A90A4` - Gráficos y acentos
- **Verde**: `#28A745` - Calificaciones altas
- **Amarillo**: `#FFC107` - Calificaciones medias
- **Rojo**: `#DC3545` - Calificaciones bajas

### Modificar Colores
Edita el diccionario `self.colors` en la clase `ProfessorPDFGenerator`:

```python
self.colors = {
    'primary': '#2E4A6B',      # Tu color principal
    'secondary': '#4A90A4',    # Tu color secundario
    # ... más colores
}
```

### Personalizar Layout
- **Tamaño de página**: 8.5" x 11" (carta)
- **Márgenes**: 10% en todos los lados
- **Fuente**: DejaVu Sans
- **DPI**: 300 para calidad de impresión

## 📊 Métricas Incluidas

### Por Profesor
1. **Calidad Docente** - Análisis Bayesiano de calificaciones
2. **Tasa de Recomendación** - Porcentaje de estudiantes que recomiendan
3. **Número de Evaluaciones** - Total de reviews recibidas
4. **Puntaje de Confiabilidad** - Medida de integridad de los datos

### Análisis Avanzados
1. **Z-Score por Materia** - Rendimiento normalizado por asignatura
2. **Tendencia Temporal** - Evolución de la calidad en el tiempo
3. **Análisis de Sentimiento** - Procesamiento NLP de comentarios
4. **Temas Principales** - Palabras clave más mencionadas

## ⚡ Rendimiento

### Tiempos de Procesamiento Estimados
- **100 profesores**: ~2-3 minutos
- **500 profesores**: ~8-12 minutos
- **1000 profesores**: ~15-25 minutos

### Optimizaciones
- Procesamiento en lotes para gráficos
- Caché de cálculos repetitivos
- Compresión automática de imágenes
- Manejo eficiente de memoria

## 🛠️ Resolución de Problemas

### Error: "No module named 'matplotlib'"
```bash
pip install matplotlib seaborn pandas numpy
```

### Error: "No se encontró el directorio de datos"
Verifica que:
1. El directorio `out/profesores_enriquecido` existe
2. Contiene archivos `.json` válidos
3. Los archivos tienen la estructura correcta

### Archivo PDF corrupto o vacío
1. Verifica que tienes permisos de escritura
2. Asegúrate de tener espacio en disco suficiente
3. Cierra otros programas que puedan estar usando mucha memoria

### Gráficos no se muestran correctamente
```bash
# En sistemas Linux, puede ser necesario:
sudo apt-get install python3-tk

# En macOS:
brew install python-tk
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Configurar directorio de datos por defecto
export PROFESSORS_DATA_DIR="ruta/a/tus/datos"

# Configurar directorio de salida
export PDF_OUTPUT_DIR="ruta/de/salida"
```

### Configuración de Matplotlib
Para mejor calidad de salida:
```python
import matplotlib
matplotlib.use('Agg')  # Backend sin interfaz gráfica
plt.rcParams['figure.dpi'] = 300  # Alta resolución
```

## 📈 Ejemplos de Salida

### Página de Título
- Logo y título principal
- Estadísticas generales del reporte
- Información de la universidad
- Fecha de generación

### Resumen Ejecutivo
- Histogramas de distribución de calidad
- Gráficos de tasas de recomendación
- Tabla de estadísticas resumidas
- Análisis comparativo

### Perfil Individual
- Métricas principales en cajas destacadas
- Gráfico de rendimiento por materia
- Tendencia de calidad temporal
- Análisis de sentimiento
- Comentarios recientes

## 🤝 Contribuir

### Agregar Nuevas Visualizaciones
1. Crea una nueva función en la clase `ProfessorPDFGenerator`
2. Añádela al método `create_professor_page()`
3. Actualiza la documentación

### Mejorar el Diseño
1. Modifica los estilos en `self.colors`
2. Ajusta el layout en `gs = fig.add_gridspec()`
3. Prueba con diferentes profesores

## 📄 Licencia

Este código es de uso libre para proyectos educativos y de investigación.

## 🆘 Soporte

Para reportar problemas o sugerir mejoras:
1. Documenta el error con detalles
2. Incluye el archivo de log si está disponible
3. Especifica tu sistema operativo y versión de Python

---

**¡Disfruta creando reportes profesionales de evaluación docente! 🎓✨**



