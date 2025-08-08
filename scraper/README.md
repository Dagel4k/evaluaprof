# Scraper de Mis Profesores - ITC

Script de Python para extraer información completa de todos los profesores del Instituto Tecnológico de Culiacán desde el sitio web "Mis Profesores".

## 🎯 Características

- **Extracción completa**: Obtiene todos los datos de cada profesor
- **Paginación automática**: Detecta y recorre todas las páginas (~584 profesores)
- **Manejo de errores**: Continúa aunque falle algún perfil
- **Delays aleatorios**: Evita bloqueos del sitio web
- **Formato estándar**: Salida en JSON compatible con EvaluaProf
- **Logs detallados**: Progreso en tiempo real

## 📋 Requisitos

- Python 3.8 o superior
- Conexión a internet estable
- Permisos de escritura en el directorio

## 🚀 Instalación

### 1. Clonar o descargar el proyecto
```bash
cd scraper/
```

### 2. Ejecutar el script de configuración
```bash
python setup.py
```

Este script:
- Instala todas las dependencias
- Configura Playwright con Chromium
- Crea los directorios necesarios

### 3. Instalación manual (alternativa)
```bash
pip install -r requirements.txt
playwright install chromium
```

## 📖 Uso

### Ejecución completa (recomendado)
```bash
python run_scraper.py
```

### Ejecución manual por pasos
```bash
# Solo scraping
python mis_profesores_scraper.py

# Solo procesamiento
python process_data.py
```

## 🏗️ Estructura del Sitio Web

### URL Base
```
https://www.misprofesores.com/escuelas/Instituto-Tecnologico-de-Culiacan_1642
```

### Página Principal
- **Tabla paginada** con ~584 profesores
- **Campos visibles**: Nombre, Departamento, #Calificaciones, Promedio
- **Paginación** al final de la página

### Perfil Individual
- **Información general**: Nombre, Universidad, Departamento
- **Estadísticas**: Promedio general, % recomendación, dificultad
- **Etiquetas**: Características del profesor
- **Reseñas paginadas**: Fecha, materia, calificación, comentario

## 📊 Datos Extraídos

Por cada profesor se extrae:

### Información Básica
- **Nombre completo**
- **Universidad** (fijo: Instituto Tecnológico de Culiacán)
- **Departamento/Facultad**
- **Promedio general** (escala 1-10)
- **Número total de calificaciones**
- **Porcentaje de recomendación**
- **Dificultad promedio** (escala 1-5)
- **Lista de etiquetas** (características del profesor)

### Reseñas Detalladas
- **Fecha** de la reseña
- **Materia** impartida
- **Calificación general** (escala 1-10)
- **Comentario** completo del estudiante

## 📁 Estructura de Salida

```
scraper/
├── profesores_json/        # Archivos JSON individuales
│   ├── nombre_apellido.json
│   ├── otro_profesor.json
│   └── ...
├── out/
│   └── profesores_enriquecido/   # JSON enriquecidos consumidos por la app (se copian al build)
├── logs/                   # Logs de ejecución
├── profesores_completos.json    # Archivo combinado
├── estadisticas_profesores.json # Reporte de estadísticas
├── mis_profesores_scraper.py
├── process_data.py
├── run_scraper.py
├── setup.py
├── requirements.txt
└── README.md
```

Los JSON en `out/profesores_enriquecido/` son consumidos por la app React. Al ejecutar `npm run build` dentro de `faculty-pulse-app/` se copian automáticamente a `public/profesores_enriquecido/` y se genera `fileList.json`.

## 📄 Formato JSON

Cada archivo JSON tiene la siguiente estructura:

```json
{
  "nombre": "Jesús Manuel Acosta Mejía",
  "universidad": "Instituto Tecnológico de Culiacán",
  "departamento": "Metal-Mecánica",
  "promedio_general": 8.2,
  "porcentaje_recomienda": 73,
  "dificultad_promedio": 3.2,
  "etiquetas": [
    "muchas tareas",
    "pocos exámenes",
    "clases excelentes"
  ],
  "numero_calificaciones": 34,
  "calificaciones": [
    {
      "fecha": "12/Jun/2024",
      "materia": "Álgebra Lineal",
      "calificacion_general": 9.0,
      "comentario": "Explica bien, pero exige mucho trabajo independiente."
    }
  ]
}
```

## 🛠️ Selectores CSS Utilizados

### Página Principal
- **Tabla**: `table tbody tr, .professor-row, .teacher-item`
- **Nombre**: `td a, .name a, .professor-name a`
- **Departamento**: `td:nth-child(2), .department, .dept`
- **Calificaciones**: `td:nth-child(3), .reviews, .ratings`
- **Promedio**: `td:nth-child(4), .average, .rating`

### Perfil Individual
- **Promedio**: `.progress-circle .score, .rating-circle .score`
- **Recomendación**: `.stats li, .recommendation-stats li`
- **Dificultad**: `.stats li, .difficulty-stats li`
- **Etiquetas**: `.tags .tag, .tags span`
- **Total reseñas**: `.reviews-title span, .total-reviews`

### Reseñas
- **Fecha**: `.review-date, .date`
- **Materia**: `.class, .subject`
- **Calificación**: `.review-grade, .rating`
- **Comentario**: `.comments p, .comment`

## ⚙️ Configuración Avanzada

### Delays y Timing
```python
def get_random_delay(self) -> float:
    """Retorna un delay aleatorio entre 1.5 y 4 segundos"""
    return random.uniform(1.5, 4.0)
```

### Navegador
```python
browser = playwright.chromium.launch(
    headless=True,  # Cambiar a False para debug
    args=[
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
    ]
)
```

## 🛡️ Características de Seguridad

- **User-Agent aleatorio**: Evita detección como bot
- **Delays aleatorios**: Simula comportamiento humano
- **Manejo de errores**: Continúa aunque falle algún elemento
- **Timeouts**: Evita bloqueos indefinidos
- **Retry logic**: Reintentos automáticos

## 📈 Monitoreo

El script muestra progreso en tiempo real:

```
🚀 Iniciando scraper de Mis Profesores - ITC
📁 Directorio de salida: profesores_json
🌐 Navegando a: https://www.misprofesores.com/escuelas/...
📄 Total de páginas encontradas: 30
📖 Procesando página 1/30
   Encontrados 20 profesores en esta página
👥 Total de profesores únicos encontrados: 584

📊 Procesando Jesús Manuel Acosta Mejía (1/584) - 0.2%
👨‍🏫 URL: https://www.misprofesores.com/profesores/...
✅ Guardado: Jesús Manuel Acosta Mejía
⏳ Esperando 2.3 segundos...
```

## 🔧 Solución de Problemas

### Error: "No module named 'playwright'"
```bash
pip install playwright
playwright install chromium
```

### Error: "Timeout waiting for selector"
- El sitio puede estar lento
- Verificar conexión a internet
- Aumentar timeouts en el código

### Error: "403 Forbidden"
- El sitio puede estar bloqueando
- Cambiar User-Agent
- Aumentar delays

### Error: "No professors found"
- Verificar que la URL sea correcta
- El sitio puede haber cambiado su estructura
- Revisar selectores CSS

## 📝 Logs y Debug

Para debug, cambiar `headless=True` a `headless=False`:

```python
browser = playwright.chromium.launch(
    headless=False,  # Ver navegador en acción
    # ...
)
```

## 🚧 Buenas Prácticas Implementadas

- ✅ **try/except por cada perfil**: No se cae el script completo
- ✅ **Logs por consola**: `print(f"Procesando {nombre} ({i}/{n})")`
- ✅ **Delay aleatorio**: Entre 1.5 y 4 segundos entre perfiles
- ✅ **Guardado individual**: Cada JSON se guarda al terminar el perfil
- ✅ **Carpeta específica**: `./profesores_json/` para almacenar archivos

## 🤝 Contribución

Para mejorar el scraper:

1. **Nuevos selectores**: Agregar selectores CSS alternativos
2. **Manejo de errores**: Mejorar recuperación de errores
3. **Optimización**: Reducir tiempo de ejecución
4. **Nuevas características**: Extraer datos adicionales

## ⚠️ Aviso Legal

Este script es para uso educativo y de investigación. Respeta los términos de servicio del sitio web y no sobrecargues sus servidores.

## 📞 Soporte

Para problemas o mejoras:
- Revisar logs de error
- Verificar configuración
- Probar con diferentes selectores

---

**Desarrollado para EvaluaProf - Análisis de Profesores Universitarios** 