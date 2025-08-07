# Sistema de Análisis Avanzado de Profesores

Este sistema implementa **10 técnicas de análisis estadístico avanzado** para evaluar profesores universitarios basándose en reseñas de estudiantes.

## 🎯 Características Principales

### 1. **Decaimiento Temporal (EWMA)**
- Pondera reseñas por su "edad" con semivida de 24 meses
- Resuelve el problema de reseñas antiguas que inflan el score actual
- Fórmula: `w_i = 0.5 ** (Δt_i / H)`

### 2. **Ajuste Bayesiano (Empirical Bayes)**
- Combina media del profesor con prior global
- Estabiliza scores para profesores con pocas reseñas
- Fórmula: `bayes_score = (μ*k + Σ x_i) / (k + n)`

### 3. **Intervalos de Wilson**
- Calcula intervalos de confianza para tasas de recomendación
- Maneja incertidumbre en proporciones con pocas observaciones
- Evita interpretaciones engañosas de 100% con n=5

### 4. **Normalización por Materia (Z-Score)**
- Mide qué tan bueno es un profesor dentro de cada materia
- Considera inflación/deflación de materias específicas
- Z-score contextual: `z_i = (x_i - μ_m) / σ_m`

### 5. **Frontera de Pareto**
- Identifica profesores no dominados (alta calidad, baja dificultad)
- Algoritmo eficiente O(n log n)
- Visualización de eficiencia

### 6. **Análisis NLP**
- Extracción de tópicos con TF-IDF + NMF
- Análisis de sentimiento básico
- Identificación de patrones en comentarios

### 7. **Análisis de Equidad**
- Correlación entre dificultad y calificaciones recibidas
- Índice de equidad: `equidad = 1 - max(0, ρ_pos)`
- Evalúa si el profesor es "justo" (no punitivo)

### 8. **Integridad de Reseñas**
- Detección de duplicados por similitud de comentarios
- Identificación de ráfagas (múltiples reseñas en poco tiempo)
- Score de confianza basado en múltiples factores

### 9. **Análisis de Tendencias**
- EWMA por semestre para calidad/dificultad
- Pronóstico simple con bandas de incertidumbre
- Identificación de tendencias temporales

### 10. **Comparador A/B**
- Comparación detallada entre profesores
- Análisis de materias en común
- Métricas normalizadas y visualizaciones

## 📁 Estructura de Archivos

```
scraper/
├── advanced_analysis.py          # Análisis estadístico principal
├── visualization_dashboard.py    # Dashboard de visualización
├── analysis_utils.py            # Utilidades y comparaciones
├── run_advanced_analysis.py     # Script principal de ejecución
├── requirements_analysis.txt     # Dependencias
├── README_ANALISIS_AVANZADO.md  # Este archivo
└── profesores_json copy/        # Datos de entrada
```

## 🚀 Instalación y Uso

### 1. Instalar Dependencias

```bash
pip install -r requirements_analysis.txt
```

### 2. Ejecutar Análisis Completo

```bash
python run_advanced_analysis.py
```

### 3. Ejecutar Scripts Individuales

```bash
# Solo análisis estadístico
python advanced_analysis.py

# Solo dashboard de visualización
python visualization_dashboard.py

# Solo utilidades de análisis
python analysis_utils.py
```

## 📊 Salidas del Sistema

### Archivos Generados

1. **`advanced_analysis_results.json`**
   - Resultados completos del análisis
   - Estadísticas globales y por materia
   - Datos de todos los profesores procesados

2. **`top_professors.csv`**
   - Ranking de mejores profesores
   - Score compuesto (calidad + dificultad + confianza + equidad)
   - Métricas normalizadas

3. **`comparison_report.json`**
   - Comparaciones detalladas entre profesores
   - Análisis de materias en común
   - Tendencias temporales

### Visualizaciones

- **Frontera de Pareto**: Calidad vs Dificultad
- **Distribuciones**: Calidades, confianza, recomendaciones
- **Análisis temporal**: Tendencias por semestre
- **Comparaciones**: Radar charts, scatter plots
- **Análisis por materia**: Rankings y estadísticas

## 🔍 Ejemplos de Uso

### Análisis de un Profesor Específico

```python
from analysis_utils import ProfessorAnalysisUtils

utils = ProfessorAnalysisUtils()
analysis = utils.analyze_temporal_trends("Aaron_Cuen_Marquez")
print(f"Tendencia: {analysis['trend_direction']}")
```

### Comparación de Profesores

```python
comparison = utils.compare_professors([
    "Aaron_Cuen_Marquez", 
    "ALAN_BRITO"
])
utils.plot_comparison_chart([
    "Aaron_Cuen_Marquez", 
    "ALAN_BRITO"
])
```

### Recomendaciones por Materia

```python
recommendations = utils.generate_recommendation(
    subject="PROPIEDAD DE LOS MATERIALES",
    max_difficulty=3.0
)
```

## 📈 Métricas Clave

### Calidad Bayesiana
- Combina media del profesor con prior global
- Estabiliza scores para pocas reseñas
- Rango: 0-10

### Dificultad Actual
- Media ponderada por tiempo (EWMA)
- Semivida: 24 meses
- Rango: 0-5 (menor = mejor)

### Score de Confianza
- Basado en integridad de reseñas
- Factores: duplicados, ráfagas, varianza
- Rango: 0-1

### Índice de Equidad
- Correlación entre dificultad y calificaciones
- Evalúa justicia del profesor
- Rango: 0-1 (mayor = más equitativo)

## 🎨 Visualizaciones Disponibles

1. **Frontera de Pareto**
   - Scatter plot con tamaño = número de reseñas
   - Color = confianza
   - Estrellas = profesores eficientes

2. **Distribuciones**
   - Histogramas de calidades
   - Box plots por número de reseñas
   - Intervalos de Wilson

3. **Análisis Temporal**
   - EWMA por semestre
   - Pronósticos con bandas
   - Tendencias de calidad

4. **Comparaciones**
   - Radar charts de métricas
   - Scatter plots de calidad vs dificultad
   - Barras de confianza

## 🔧 Configuración Avanzada

### Parámetros Ajustables

```python
# Decaimiento temporal
H_months = 24  # Semivida en meses

# Ajuste bayesiano
k = 10  # Fuerza del prior (equivalente a k reseñas)

# Integridad
dup_threshold = 0.9  # Umbral de similitud para duplicados
burst_threshold = 3   # Mínimo de reseñas en un día para ráfaga
```

### Personalización de Métricas

```python
# Score compuesto personalizado
composite_score = (
    quality_bayes * 0.4 +
    (1 - difficulty_now/5) * 0.3 +
    trust_score * 0.2 +
    equidad * 0.1
)
```

## 🐛 Solución de Problemas

### Error: "No se encontró el archivo"
- Verifica que `profesores_json copy/` existe
- Asegúrate de que hay archivos JSON en el directorio

### Error: "Faltan dependencias"
```bash
pip install numpy pandas scipy scikit-learn matplotlib seaborn
```

### Error: "No hay datos suficientes"
- Algunos análisis requieren mínimo de reseñas
- Ajusta parámetros o usa datos más completos

## 📚 Referencias Técnicas

### EWMA (Exponentially Weighted Moving Average)
- Pondera observaciones por edad
- Resuelve sesgo temporal en reseñas

### Empirical Bayes
- Combina estimación local con prior global
- Estabiliza estimaciones con pocos datos

### Intervalo de Wilson
- Intervalo de confianza para proporciones
- Maneja incertidumbre en muestras pequeñas

### Frontera de Pareto
- Optimización multi-objetivo
- Identifica soluciones no dominadas

## 🤝 Contribuciones

Para mejorar el sistema:

1. Añade nuevas métricas en `advanced_analysis.py`
2. Crea visualizaciones adicionales en `visualization_dashboard.py`
3. Implementa algoritmos de ML en `analysis_utils.py`
4. Documenta cambios en este README

## 📄 Licencia

Este proyecto es de código abierto. Usa y modifica según tus necesidades.

---

**¡Disfruta analizando profesores con estadística avanzada! 🎓📊**
