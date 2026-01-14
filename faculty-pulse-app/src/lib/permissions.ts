export type UserRole = 'GUEST' | 'STUDENT_FREE' | 'STUDENT_PRO' | 'ADMIN';

export type AppFeature =
  | 'view-professors'        // Ver lista y detalles básicos
  | 'view-advanced-metrics'  // Ver análisis de sentimiento AI
  | 'access-scheduler'       // Acceder al módulo de horarios (Carga/Manual/Auto)
  | 'save-cloud-schedules'   // Guardar en base de datos
  | 'export-calendar'        // Exportar a Google/ICS
  | 'auto-generator'         // Generador automático de horarios (PRO)
  | 'remove-ads';            // Navegación sin publicidad

const ROLE_PERMISSIONS: Record<UserRole, AppFeature[]> = {
  'GUEST': [
    'view-professors'
  ],
  'STUDENT_FREE': [
    'view-professors',
    'view-advanced-metrics',
    'access-scheduler',
    'save-cloud-schedules',
    'export-calendar',
    'auto-generator',
    'remove-ads'
  ],
  'STUDENT_PRO': [
    'view-professors',
    'view-advanced-metrics',
    'access-scheduler',
    'save-cloud-schedules',
    'export-calendar',
    'auto-generator',
    'remove-ads'
  ],
  'ADMIN': [
    'view-professors',
    'view-advanced-metrics',
    'access-scheduler',
    'save-cloud-schedules',
    'export-calendar',
    'auto-generator',
    'remove-ads'
  ]
};

export const hasPermission = (role: UserRole | undefined | null, feature: AppFeature): boolean => {
  // DEV MODE: Bypass all permission checks in local development
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    return true;
  }

  // Default logic: 
  // If no role is provided, it's GUEST.
  // EXCEPT if we are in private beta, where we might want to be more lenient.
  const currentRole = role || 'GUEST';

  const permissions = ROLE_PERMISSIONS[currentRole];
  if (!permissions) {
    console.warn(`⚠️ Unknown role: ${currentRole}, defaulting to GUEST permissions`);
    return ROLE_PERMISSIONS['GUEST'].includes(feature);
  }

  return permissions.includes(feature);
};

/**
 * Check if the app is running in development mode
 */
export const isDevMode = (): boolean => {
  return import.meta.env.VITE_DEV_MODE === 'true';
};