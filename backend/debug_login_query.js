const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 DEBUGGING QUERY DE LOGIN');

const email = 'medico1@saludigital.edu.co';
const password = '1000000001';

// Usar exactamente el mismo query del servidor
const query = `
  SELECT 
    u.usuario_id, u.nombre_completo, u.email, u.numero_documento,
    r.nombre_rol, r.rol_id
  FROM Usuarios u 
  JOIN Roles r ON u.rol_id = r.rol_id 
  WHERE u.email = ?
`;

console.log(`🔍 Query: WHERE email = '${email}'`);

db.get(query, [email], (err, row) => {
  if (err) {
    console.error('❌ Error en query:', err.message);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('❌ No se encontró usuario');
    db.close();
    return;
  }
  
  console.log('✅ Usuario encontrado:');
  console.log(`   - usuario_id: ${row.usuario_id}`);
  console.log(`   - nombre_completo: ${row.nombre_completo}`);
  console.log(`   - email: ${row.email}`);
  console.log(`   - numero_documento: ${row.numero_documento}`);
  console.log(`   - nombre_rol: ${row.nombre_rol}`);
  console.log(`   - rol_id: ${row.rol_id}`);
  
  // Verificar contraseña
  if (password === row.numero_documento) {
    console.log('✅ Contraseña correcta');
  } else {
    console.log('❌ Contraseña incorrecta');
    console.log(`   Esperaba: ${password}`);
    console.log(`   Encontró: ${row.numero_documento}`);
  }
  
  // Simular respuesta del servidor
  console.log('\n📤 Respuesta que debería enviar el servidor:');
  console.log(JSON.stringify({
    success: true,
    user: {
      id: row.usuario_id,
      name: row.nombre_completo,
      email: row.email,
      role: row.nombre_rol,
      roleId: row.rol_id,
      team: null,
      document: row.numero_documento
    }
  }, null, 2));
  
  db.close();
});
