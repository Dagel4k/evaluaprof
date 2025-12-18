# Plan de Infraestructura Empresarial (Previo a Pagos)

Este documento detalla la arquitectura necesaria para transformar el prototipo funcional en una plataforma SaaS robusta, segura y escalable, antes de integrar cualquier pasarela de pagos.

---

## 1. Identidad y Control de Acceso (IAM) Grado Empresarial

El objetivo es asegurar que la identidad del usuario sea inmutable y su acceso esté estrictamente controlado.

### A. Autenticación Robusta (AuthN)
*   **Proveedores:**
    *   **Email/Password:** Con reglas estrictas (mínimo 12 caracteres, símbolos, validación contra bases de datos de contraseñas filtradas pwned-passwords).
    *   **OAuth2 (Social):** Google y Microsoft (crucial para cuentas universitarias).
*   **Verificación:** Email obligatorio verificado antes de permitir acceso a funciones críticas.
*   **MFA (Multi-Factor Authentication):** Opcional para usuarios Free, Obligatorio para Admins.

### B. Gestión de Sesiones (Concurrency Control)
*   **Requerimiento:** "No más de una sesión activa por usuario". Evita que una sola cuenta "Pro" sea compartida por todo un salón de clases (Account Sharing).
*   **Implementación Técnica:**
    *   Al iniciar sesión, se genera un `session_id` único y se guarda en la base de datos junto con el `user_id`.
    *   **Middleware de Seguridad:** En cada petición protegida, se compara el `session_id` del token JWT contra el de la base de datos.
    *   **Invalidación:** Si se detecta un nuevo login, se invalida el token anterior inmediatamente (o se le notifica al usuario: *"Se ha iniciado sesión en otro dispositivo"*).

### C. Control de Acceso Basado en Roles (RBAC)
Sistema granular de permisos, no solo "booleans" en la base de datos.
*   **Roles:**
    *   `GUEST`: Visitante no logueado.
    *   `STUDENT_FREE`: Usuario registrado (Límites estrictos).
    *   `STUDENT_PRO`: Acceso completo al Generador y Analytics.
    *   `ADMIN`: Acceso al dashboard de métricas y gestión de usuarios.
*   **Scopes:** Definir qué puede hacer cada rol (ej: `schedule:create`, `schedule:export`, `ai:analyze`).

---

## 2. Seguridad de Datos e Infraestructura

Dado que manejamos información académica (horarios, ubicación de aulas), la seguridad es prioridad.

### A. Row Level Security (RLS)
*   La base de datos (PostgreSQL/Supabase) debe implementar políticas RLS.
*   **Regla de Oro:** Una consulta `SELECT * FROM schedules` por defecto **no devuelve nada**. Solo debe devolver filas donde `user_id == current_user()`.
*   Esto previene fugas de datos masivas incluso si hay vulnerabilidades en el frontend.

### B. Rate Limiting y Protección de API
El "Generador Automático" consume CPU y recursos.
*   **WAF (Web Application Firewall):** Protección contra DDoS.
*   **Throttling por Usuario:**
    *   Free: 3 generaciones por día.
    *   Pro: Ilimitado (con límites razonables de abuso, ej. 50/hora).
*   Esto protege tus costos de servidor y evita ataques de fuerza bruta.

### C. Auditoría (Audit Logs)
*   Registro inmutable de acciones críticas: "Cambio de contraseña", "Eliminación de horario", "Aceptación de términos".
*   Necesario para disputas y seguridad.

---

## 3. Experiencia de Usuario (UX) para la Suscripción

Antes de cobrar, hay que vender y gestionar la expectativa legal.

### A. Landing de Precios (Pricing Page)
*   Diseño psicológico de tablas comparativas (Anchoring).
*   Lista clara de features Free vs Pro.
*   Tooltips explicativos en cada feature (ej: "¿Qué es el 'Sentiment Analysis'?").

### B. Flujo de "Upgrade" (Funnel)
1.  **Trigger:** El usuario intenta usar una función Pro (ej: "Generar Horario").
2.  **Intercept:** Modal "Feature Gated" que explica el valor, no solo pide dinero.
3.  **Selección:** Mensual vs Semestral (Descuento).
4.  **Legal Check:** Checkbox obligatorio "Acepto Términos del Servicio y Política de Reembolso".
5.  **Call to Action:** Botón "Ir a Pagar" (Aquí terminaría esta fase).

### C. Gestión de Cuenta (Self-Serve)
*   Portal de usuario para:
    *   Ver estado actual (Free/Pro).
    *   Descargar facturas (Placeholder por ahora).
    *   **Botón de Cancelación:** Debe ser tan fácil cancelar como suscribirse (Dark pattern avoidance).
    *   "Cerrar todas las sesiones": Botón de pánico de seguridad.

---

## 4. Aspectos Legales y Compliance

Para operar como empresa legítima y evitar demandas.

### A. Documentos Legales
*   **Términos y Condiciones (ToS):** Definir el uso aceptable (no scraping, no revender cuentas).
*   **Política de Privacidad:** Explicar qué datos recolectamos (horarios, emails) y cómo se usan (analytics, mejoras AI).
*   **Política de Cookies:** Banner de consentimiento.

### B. Propiedad de Datos
*   Definir claramente: ¿De quién es el horario generado? ¿Del usuario o de la plataforma?
*   Mecanismo de "Exportar mis datos" (GDPR requirement) y "Eliminar mi cuenta" (Right to be forgotten).

---

## 5. Roadmap de Implementación Técnica (Fase "Foundation")

### Paso 1: Configuración de Supabase (Backend as a Service)
*   [ ] Crear proyecto y configurar tablas (`profiles`, `schedules`, `audit_logs`).
*   [ ] Implementar **RLS (Policies)** estrictas.
*   [ ] Configurar Auth con Google y Email.

### Paso 2: Implementar "Single Session Enforcement"
*   [ ] Crear tabla `active_sessions`.
*   [ ] Crear Database Functions (Triggers) que limpien sesiones viejas al crear nuevas.
*   [ ] Middleware en React para detectar token inválido y redirigir a Login.

### Paso 3: Feature Flags & Gating
*   [ ] Crear sistema de `permissions.ts` en el frontend.
*   [ ] Envolver componentes Pro (ej: `SchedulerEngine`) con `<RestrictedFeature feature="auto-generator">`.
*   [ ] Crear Modal de "Upgrade" reutilizable.

### Paso 4: Páginas Legales & Settings
*   [ ] Crear `/legal/terms` y `/legal/privacy`.
*   [ ] Crear `/settings/profile` y `/settings/billing`.

### Paso 5: Pruebas de Seguridad
*   [ ] Intentar acceder a datos de otro usuario vía API directa.
*   [ ] Intentar loguearse en dos navegadores simultáneamente y verificar la desconexión.
