# EvaluaProf - Guía de Desarrollo Local

## 🚀 Inicio Rápido

### Configuración Automática

```bash
cd faculty-pulse-app
./setup-dev.sh
npm run dev
```

Abre http://localhost:8080/ - ¡Todas las funciones premium están desbloqueadas!

---

## 📋 Modo Desarrollo

El modo dev está activado cuando `VITE_DEV_MODE=true` en tu archivo `.env`.

### Características Desbloqueadas

- ✅ **Sin login requerido** - Usuario dev creado automáticamente
- ✅ **Generador automático** - Sin restricciones de usuario PRO
- ✅ **Todas las funciones premium** - Exportación, análisis AI, etc.
- ✅ **Sin anuncios** - Navegación limpia

### Usuario Dev

- **Nombre:** Developer (Local)
- **Email:** dev@local.test
- **Rol:** STUDENT_PRO (acceso completo)

---

## 🔧 Configuración Manual

Si prefieres configurar manualmente:

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```

2. Edita `.env` y agrega:
   ```env
   VITE_DEV_MODE=true
   ```

3. Inicia el servidor:
   ```bash
   npm run dev
   ```

---

## 📦 Cargar Datos Reales

Para probar con datos reales del portal universitario:

1. Abre http://localhost:8080/
2. Ve a "Constructor de Horarios"
3. Arrastra el archivo `message.json` (en la raíz del proyecto)
4. ¡Listo! Todas las materias se cargarán automáticamente

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo
npm run build            # Compilar para producción
npx tsc --noEmit         # Verificar tipos TypeScript

# Setup
./setup-dev.sh           # Configurar entorno dev
```

---

## 🔒 Seguridad

- El archivo `.env` está en `.gitignore` (no se sube al repo)
- En producción, `VITE_DEV_MODE` no estará presente
- El bypass solo funciona en desarrollo local

---

## 📚 Más Información

Ver [walkthrough.md](file:///Users/daniel/.gemini/antigravity/brain/8199433c-f4b9-4fe3-b291-1555efe1e775/walkthrough.md) para detalles técnicos completos.
