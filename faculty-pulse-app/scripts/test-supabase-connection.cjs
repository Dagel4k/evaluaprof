const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Cargar variables de entorno manualmente
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl = '';
let supabaseKey = '';

try {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      if (key.trim() === 'VITE_SUPABASE_URL') supabaseUrl = value.trim();
      if (key.trim() === 'VITE_SUPABASE_ANON_KEY') supabaseKey = value.trim();
    }
  });
} catch (e) {
  console.error('❌ No se pudo leer el archivo .env');
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales en .env (VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

console.log(`📡 Intentando conectar a: ${supabaseUrl}`);

// 2. Inicializar cliente
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. Probar conexión
async function testConnection() {
  const start = Date.now();
  try {
    // Intentamos hacer un ping a la autenticación (no requiere tablas)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;

    const time = Date.now() - start;
    console.log(`✅ ¡Conexión Exitosa! (${time}ms)`);
    console.log('   El cliente de Supabase se inicializó correctamente.');
    
    // 4. Probar acceso a la base de datos (si las tablas existen)
    console.log('📊 Verificando tablas...');
    const { error: dbError } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    if (dbError) {
      console.warn('⚠️  Conexión a Auth OK, pero error al acceder a tablas:');
      console.warn(`   ${dbError.message}`);
      console.warn('   (Asegúrate de haber ejecutado el script schema.sql en el SQL Editor de Supabase)');
    } else {
      console.log('✅ Tablas accesibles (schema.sql parece haberse aplicado).');
    }

  } catch (err) {
    console.error('❌ Error de conexión:', err.message);
    console.error('   Verifique que la URL y la ANON KEY sean correctas.');
  }
}

testConnection();
