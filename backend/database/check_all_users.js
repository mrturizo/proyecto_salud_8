const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Verificar todos los usuarios con más detalles
db.all("SELECT usuario_id, nombre_completo, email, rol_id, activo FROM Usuarios", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n👥 Todos los usuarios en la base de datos:');
  usuarios.forEach(user => {
    console.log(`  - ID: ${user.usuario_id}`);
    console.log(`    Nombre: ${user.nombre_completo}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Rol ID: ${user.rol_id}`);
    console.log(`    Activo: ${user.activo}`);
    console.log('    ---');
  });
  
  // Verificar si existe algún usuario con email similar
  console.log('\n🔍 Buscando usuarios con emails similares:');
  db.all("SELECT * FROM Usuarios WHERE email LIKE '%medico%' OR email LIKE '%saludigital%'", (err, usuariosSimilares) => {
    if (err) {
      console.error('Error buscando usuarios similares:', err);
    } else {
      if (usuariosSimilares.length > 0) {
        console.log('Usuarios encontrados con emails similares:');
        usuariosSimilares.forEach(user => {
          console.log(`  - ${user.nombre_completo}: ${user.email}`);
        });
      } else {
        console.log('No se encontraron usuarios con emails similares');
      }
    }
    db.close();
  });
});
