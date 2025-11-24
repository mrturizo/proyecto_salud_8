const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICANDO TODOS LOS USUARIOS CON ESE EMAIL');

// Buscar TODOS los usuarios (no solo los que coinciden con el email)
db.all("SELECT * FROM Usuarios ORDER BY usuario_id", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`\n📋 TODOS los usuarios en la base de datos (${usuarios.length} total):`);
  
  usuarios.forEach(user => {
    console.log(`\n👤 Usuario ID ${user.usuario_id}:`);
    console.log(`   - Nombre: ${user.nombre_completo}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Documento: ${user.numero_documento}`);
    console.log(`   - Rol ID: ${user.rol_id}`);
    console.log(`   - Activo: ${user.activo}`);
    
    if (user.email === 'medico1@saludigital.edu.co') {
      console.log(`   🔥 ESTE ES EL EMAIL QUE ESTAMOS BUSCANDO!`);
    }
  });
  
  // Ahora probar el query exacto del servidor
  console.log('\n🔍 Probando query exacto del servidor:');
  const query = `
    SELECT 
      u.usuario_id, u.nombre_completo, u.email, u.numero_documento,
      r.nombre_rol, r.rol_id
    FROM Usuarios u 
    JOIN Roles r ON u.rol_id = r.rol_id 
    WHERE u.email = ?
  `;
  
  db.get(query, ['medico1@saludigital.edu.co'], (err, row) => {
    if (err) {
      console.error('Error:', err);
    } else if (row) {
      console.log(`✅ Query del servidor devuelve:`);
      console.log(`   - usuario_id: ${row.usuario_id}`);
      console.log(`   - nombre_completo: ${row.nombre_completo}`);
      console.log(`   - email: ${row.email}`);
    } else {
      console.log('❌ Query del servidor no devuelve nada');
    }
    
    db.close();
  });
});
