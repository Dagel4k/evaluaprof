import React from 'react';
import { LegalLayout } from './LegalLayout';

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout title="Política de Privacidad Integral" lastUpdated="17 de Diciembre, 2025">
      <div className="space-y-6 text-justify">
        <p className="lead text-lg text-muted-foreground">
          En EvaluaProf, accesible desde nuestra aplicación web y móvil, una de nuestras principales prioridades es la privacidad de nuestros visitantes. Este documento de Política de Privacidad contiene tipos de información que EvaluaProf recopila y registra y cómo la utilizamos.
        </p>

        <section>
          <h3>1. Responsable del Tratamiento</h3>
          <p>
            EvaluaProf Inc. actúa como el "Controlador de Datos" de su información personal.
            Si tiene preguntas adicionales o requiere más información sobre nuestra Política de Privacidad, no dude en contactarnos a través de correo electrónico en <a href="mailto:privacy@evaluaprof.com" className="underline">privacy@evaluaprof.com</a>.
          </p>
        </section>

        <section>
          <h3>2. Base Legal para el Procesamiento</h3>
          <p>Procesamos sus datos personales bajo las siguientes bases legales (GDPR Art. 6):</p>
          <ul>
            <li><strong>Ejecución de un Contrato:</strong> Para proporcionarle los servicios de generación de horarios que ha solicitado.</li>
            <li><strong>Consentimiento:</strong> Para el envío de boletines informativos o cookies no esenciales.</li>
            <li><strong>Interés Legítimo:</strong> Para mejorar la seguridad de nuestra plataforma y analizar tendencias de uso.</li>
          </ul>
        </section>

        <section>
          <h3>3. Información que Recopilamos</h3>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h4 className="text-base font-bold mb-2">Datos Proporcionados por Usted</h4>
              <ul className="text-sm space-y-1">
                <li>Información de registro (Email, Nombre, Contraseña cifrada).</li>
                <li>Datos académicos (Materias, Horarios preferidos).</li>
                <li>Comunicaciones con soporte.</li>
              </ul>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg border">
              <h4 className="text-base font-bold mb-2">Datos Recopilados Automáticamente</h4>
              <ul className="text-sm space-y-1">
                <li>Dirección IP y tipo de dispositivo.</li>
                <li>Logs de actividad y seguridad.</li>
                <li>Cookies y datos de uso.</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h3>4. Cómo Usamos su Información</h3>
          <p>Utilizamos la información recopilada de varias maneras, incluyendo para:</p>
          <ul className="list-disc pl-5">
            <li>Proporcionar, operar y mantener nuestro sitio web.</li>
            <li>Mejorar, personalizar y expandir nuestro sitio web.</li>
            <li>Comprender y analizar cómo utiliza nuestro sitio web.</li>
            <li>Desarrollar nuevos productos, servicios, características y funcionalidades.</li>
            <li>Procesar sus transacciones y gestionar sus pedidos.</li>
            <li>Enviar correos electrónicos (confirmaciones, facturas, actualizaciones técnicas).</li>
            <li>Encontrar y prevenir el fraude.</li>
          </ul>
        </section>

        <section>
          <h3>5. Procesadores de Datos (Terceros)</h3>
          <p>Compartimos datos únicamente con proveedores de infraestructura esenciales que cumplen con normativas de seguridad estrictas:</p>
          <ul>
            <li><strong>Supabase (EE. UU.):</strong> Alojamiento de base de datos y autenticación.</li>
            <li><strong>OpenAI (EE. UU.):</strong> Procesamiento de texto para análisis de sentimiento (datos anonimizados).</li>
            <li><strong>Stripe (Global):</strong> Procesamiento de pagos (EvaluaProf no almacena datos de tarjetas de crédito).</li>
          </ul>
        </section>

        <section>
          <h3>6. Retención de Datos</h3>
          <p>
            Conservaremos su información personal solo durante el tiempo que sea necesario para los fines establecidos en esta Política de Privacidad. Retendremos y utilizaremos su información en la medida necesaria para cumplir con nuestras obligaciones legales (por ejemplo, si estamos obligados a conservar sus datos para cumplir con las leyes aplicables), resolver disputas y hacer cumplir nuestros acuerdos legales y políticas.
          </p>
        </section>

        <section>
          <h3>7. Sus Derechos de Protección de Datos (ARCO/GDPR)</h3>
          <p>Dependiendo de su ubicación, usted tiene los siguientes derechos:</p>
          <ul className="list-disc pl-5">
            <li><strong>Derecho de acceso:</strong> Tiene derecho a solicitar copias de sus datos personales.</li>
            <li><strong>Derecho a la rectificación:</strong> Tiene derecho a solicitar que corrijamos cualquier información que crea que es inexacta.</li>
            <li><strong>Derecho a la eliminación ("Derecho al olvido"):</strong> Tiene derecho a solicitar que borremos sus datos personales, bajo ciertas condiciones.</li>
            <li><strong>Derecho a la portabilidad de los datos:</strong> Tiene derecho a solicitar que transfiramos los datos que hemos recopilado a otra organización, o directamente a usted.</li>
          </ul>
        </section>

        <section>
          <h3>8. Seguridad de los Datos</h3>
          <p>
            La seguridad de sus datos es importante para nosotros, pero recuerde que ningún método de transmisión a través de Internet o método de almacenamiento electrónico es 100% seguro. Si bien nos esforzamos por utilizar medios comercialmente aceptables para proteger su información personal (cifrado SSL, RLS en base de datos), no podemos garantizar su seguridad absoluta.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};