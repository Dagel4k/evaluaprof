# 📊 Generador de PDF - Evaluación de Profesores

## 🚀 Uso Rápido

### Opción 1: Generación Completa (Recomendada)
```bash
python generar_pdf_completo.py
```
**Genera un PDF con TODOS los profesores del directorio**

### Opción 2: Demo Pequeño (Para Pruebas)
```bash
python test_pdf_demo.py
```
**Genera un PDF con solo 5 profesores para probar**

### Opción 3: Interactivo
```bash
python run_pdf_generator.py
```
**Te permite elegir opciones personalizadas**

## 📋 Requisitos

### Instalar dependencias:
```bash
pip install matplotlib seaborn pandas numpy
```

### Verificar directorio de datos:
- Debe existir: `out/profesores_enriquecido/`
- Debe contener archivos `.json` de profesores

## 📄 Resultado

El PDF generado incluye:

### 📊 **Página de Título**
- Estadísticas generales
- Información de la universidad
- Fecha de generación

### 📈 **Resumen Ejecutivo**
- Distribución de calidad docente
- Tasas de recomendación
- Análisis de confiabilidad
- Estadísticas comparativas

### 👨‍🏫 **Perfil Individual** (por cada profesor)
- **Métricas principales**: Calidad, Recomendación, Evaluaciones, Confiabilidad
- **Análisis por materias**: Rendimiento normalizado por asignatura
- **Tendencias temporales**: Evolución de la calidad
- **Análisis de sentimiento**: Procesamiento de comentarios
- **Temas principales**: Palabras clave más mencionadas
- **Comentarios recientes**: Evaluaciones destacadas

## ⏱️ Tiempos Estimados

| Profesores | Tiempo | Tamaño PDF |
|------------|--------|------------|
| 5 (demo)   | 10s    | 0.1 MB     |
| 100        | 3 min  | 2-3 MB     |
| 500        | 12 min | 8-12 MB    |
| 1000+      | 25 min | 15-25 MB   |

## 🎨 Características del Diseño

- **Colores profesionales** con esquema azul corporativo
- **Gráficos de alta calidad** (300 DPI)
- **Layout responsivo** adaptado a página carta
- **Tipografía clara** con DejaVu Sans
- **Visualizaciones estadísticas** con matplotlib y seaborn

## 🛠️ Solución de Problemas

### Error: "No module named 'matplotlib'"
```bash
pip install matplotlib seaborn pandas numpy
```

### Error: "No se encontró el directorio"
- Verifica que existe `out/profesores_enriquecido/`
- Asegúrate de ejecutar desde el directorio `scraper/`

### PDF muy lento para abrir
- Es normal con muchos profesores
- Usa Adobe Reader u otro visor robusto
- El archivo puede ser de varios MB

### Proceso muy lento
- Es normal, el procesamiento es intensivo
- No cierres la ventana hasta que termine
- Puedes probar primero con el demo

## 📁 Archivos Incluidos

- `generar_pdf_completo.py` - **Script principal** (usar este)
- `test_pdf_demo.py` - Demo con 5 profesores
- `run_pdf_generator.py` - Versión interactiva
- `generate_professors_pdf.py` - Código base del generador
- `requirements_pdf.txt` - Lista de dependencias

## 💡 Consejos

1. **Primera vez**: Ejecuta el demo para probar
2. **Producción**: Usa `generar_pdf_completo.py`
3. **Personalización**: Edita los colores en `generate_professors_pdf.py`
4. **Rendimiento**: Cierra otros programas para liberar memoria
5. **Impresión**: El PDF está optimizado para impresión en papel carta

---

**¡Listo para generar reportes profesionales! 🎓✨**



