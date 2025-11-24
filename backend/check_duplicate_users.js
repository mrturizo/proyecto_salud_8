const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICANDO USUARIOS DUPLICADOS');

// Buscar todos los usuarios con ese email
db.all("SELECT * FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`\n📋 Usuarios encontrados con email 'medico1@saludigital.edu.co': ${usuarios.length}`);
  
  usuarios.forEach((user, index) => {
    console.log(`\n👤 Usuario ${index + 1}:`);
    console.log(`   - ID: ${user.usuario_id}`);
    console.log(`   - Nombre: ${user.nombre_completo}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Documento: ${user.numero_documento}`);
    console.log(`   - Rol ID: ${user.rol_id}`);
    console.log(`   - Activo: ${user.activo}`);
  });
  
  // Verificar demandas asignadas a cada uno
  console.log('\n📋 Demandas asignadas:');
  usuarios.forEach(user => {
    db.all("SELECT COUNT(*) as count FROM Demandas_Inducidas WHERE asignado_a_uid = ?", [user.usuario_id], (err, result) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(`   - Usuario ID ${user.usuario_id}: ${result[0].count} demandas`);
      }
    });
  });
  
  db.close();
});
