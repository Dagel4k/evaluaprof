import React from 'react';
import { LegalLayout } from './LegalLayout';

export const TermsPage: React.FC = () => {
  return (
    <LegalLayout title="Términos y Condiciones de Servicio" lastUpdated="17 de Diciembre, 2025">
      <div className="space-y-6 text-justify">
        <p className="lead text-lg text-muted-foreground">
          Por favor, lea detenidamente estos Términos y Condiciones ("Términos", "Condiciones") antes de utilizar el sitio web y la aplicación móvil EvaluaProf (el "Servicio") operado por EvaluaProf Inc. ("nosotros", "nos", o "nuestro").
        </p>

        <section>
          <h3>1. Aceptación de los Términos</h3>
          <p>
            Al acceder o utilizar el Servicio, usted acepta estar sujeto a estos Términos. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al Servicio. Estos Términos se aplican a todos los visitantes, usuarios y otras personas que accedan o utilicen el Servicio.
          </p>
        </section>

        <section>
          <h3>2. Descripción del Servicio</h3>
          <p>
            EvaluaProf es una plataforma de análisis de datos académicos y planificación de horarios. Utilizamos algoritmos de inteligencia artificial para procesar información pública y proporcionada por los usuarios con el fin de sugerir combinaciones de horarios optimizadas.
          </p>
          <div className="bg-muted p-4 rounded-md border-l-4 border-primary text-sm">
            <strong>Renuncia de Responsabilidad Académica:</strong> EvaluaProf es una herramienta de asistencia. No garantizamos la inscripción en cursos, la disponibilidad de cupos, la precisión de los horarios oficiales de la universidad ni el éxito académico del usuario. Usted es el único responsable de verificar su inscripción oficial en el portal de su institución.
          </div>
        </section>

        <section>
          <h3>3. Cuentas y Seguridad</h3>
          <p>
            Al crear una cuenta con nosotros, debe proporcionarnos información precisa, completa y actual en todo momento. El incumplimiento de esto constituye una violación de los Términos, que puede resultar en la terminación inmediata de su cuenta.
          </p>
          <ul>
            <li>Usted es responsable de salvaguardar la contraseña que utiliza para acceder al Servicio.</li>
            <li>Acepta no revelar su contraseña a ningún tercero.</li>
            <li>Debe notificarnos inmediatamente al darse cuenta de cualquier violación de seguridad o uso no autorizado de su cuenta.</li>
            <li><strong>Prohibición de Cuentas Compartidas:</strong> Las suscripciones "Pro" son estrictamente personales. El uso simultáneo de una cuenta en múltiples dispositivos por diferentes personas resultará en la suspensión del servicio.</li>
          </ul>
        </section>

        <section>
          <h3>4. Propiedad Intelectual</h3>
          <p>
            El Servicio y su contenido original (excluyendo el Contenido proporcionado por los usuarios), características y funcionalidad son y seguirán siendo propiedad exclusiva de EvaluaProf y sus licenciantes. El Servicio está protegido por derechos de autor, marcas registradas y otras leyes tanto de México como de países extranjeros.
          </p>
        </section>

        <section>
          <h3>5. Uso Prohibido</h3>
          <p>Usted se compromete a no utilizar el Servicio para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Cualquier propósito ilegal o no autorizado.</li>
            <li>Extraer datos masivamente (Scraping) de nuestra base de datos de profesores.</li>
            <li>Intentar interferir con el funcionamiento adecuado del Servicio (ataques DDoS, inyección SQL).</li>
            <li>Revender el acceso a su cuenta o a los datos generados por la plataforma.</li>
          </ul>
        </section>

        <section>
          <h3>6. Terminación</h3>
          <p>
            Podemos cancelar o suspender su cuenta de forma inmediata, sin previo aviso o responsabilidad, por cualquier motivo, incluso sin limitación, si usted incumple los Términos. Tras la terminación, su derecho a utilizar el Servicio cesará inmediatamente.
          </p>
        </section>

        <section>
          <h3>7. Limitación de Responsabilidad</h3>
          <p className="uppercase text-xs font-bold text-muted-foreground mb-2">LEA ESTO CUIDADOSAMENTE</p>
          <p>
            En ningún caso EvaluaProf, ni sus directores, empleados, socios, agentes, proveedores o afiliados, serán responsables de daños indirectos, incidentales, especiales, consecuentes o punitivos, incluyendo sin limitación, pérdida de beneficios, datos, uso, buena voluntad, u otras pérdidas intangibles, resultantes de (i) su acceso o uso o incapacidad de acceder o usar el Servicio; (ii) cualquier conducta o contenido de cualquier tercero en el Servicio; (iii) cualquier contenido obtenido del Servicio; y (iv) acceso no autorizado, uso o alteración de sus transmisiones o contenido.
          </p>
        </section>

        <section>
          <h3>8. Cambios</h3>
          <p>
            Nos reservamos el derecho, a nuestra sola discreción, de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es material, intentaremos proporcionar un aviso de al menos 30 días antes de que entren en vigor los nuevos términos.
          </p>
        </section>

        <section>
          <h3>9. Contacto</h3>
          <p>
            Si tiene alguna pregunta sobre estos Términos, por favor contáctenos en: <a href="mailto:legal@evaluaprof.com" className="font-bold underline">legal@evaluaprof.com</a>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};