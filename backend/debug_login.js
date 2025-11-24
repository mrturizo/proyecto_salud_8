const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 DEBUGGING LOGIN DE Dr. Carlos Mendoza');

// Simular exactamente el query del login
const email = 'medico1@saludigital.edu.co';
const password = '1000000001'; // La contraseña que está usando

const query = `
  SELECT 
    u.usuario_id, u.nombre_completo, u.email, u.numero_documento,
    r.nombre_rol, r.rol_id
  FROM Usuarios u 
  JOIN Roles r ON u.rol_id = r.rol_id 
  WHERE u.email = ? AND u.numero_documento = ?
`;

console.log(`🔍 Query: WHERE email = '${email}' AND numero_documento = '${password}'`);

db.get(query, [email, password], (err, row) => {
  if (err) {
    console.error('❌ Error en query:', err.message);
    db.close();
    return;
  }
  
  if (!row) {
    console.log('❌ No se encontró usuario con esas credenciales');
    
    // Verificar qué usuarios existen con ese email
    console.log('\n🔍 Verificando usuarios con ese email:');
    db.all("SELECT usuario_id, nombre_completo, email, numero_documento FROM Usuarios WHERE email = ?", [email], (err, users) => {
      if (err) {
        console.error('Error:', err);
      } else {
        users.forEach(user => {
          console.log(`   - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}, Documento: ${user.numero_documento}`);
        });
      }
      db.close();
    });
  } else {
    console.log('✅ Usuario encontrado:');
    console.log(`   - usuario_id: ${row.usuario_id}`);
    console.log(`   - nombre_completo: ${row.nombre_completo}`);
    console.log(`   - email: ${row.email}`);
    console.log(`   - numero_documento: ${row.numero_documento}`);
    console.log(`   - nombre_rol: ${row.nombre_rol}`);
    console.log(`   - rol_id: ${row.rol_id}`);
    
    // Simular la respuesta del backend
    console.log('\n📤 Respuesta que debería enviar el backend:');
    console.log(JSON.stringify({
      success: true,
      user: {
        id: row.usuario_id,
        name: row.nombre_completo,
        email: row.email,
        role: row.nombre_rol,
        roleId: row.rol_id,
        team: row.nombre_equipo,
        document: row.numero_documento
      }
    }, null, 2));
    
    db.close();
  }
});
