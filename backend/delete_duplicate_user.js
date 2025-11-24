const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 ELIMINANDO USUARIO DUPLICADO');

// Verificar usuarios antes de eliminar
db.all("SELECT * FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`\n📋 Usuarios encontrados con email 'medico1@saludigital.edu.co': ${usuarios.length}`);
  
  usuarios.forEach(user => {
    console.log(`\n👤 Usuario ID ${user.usuario_id}:`);
    console.log(`   - Nombre: ${user.nombre_completo}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Documento: ${user.numero_documento}`);
    console.log(`   - Rol ID: ${user.rol_id}`);
    console.log(`   - Activo: ${user.activo}`);
  });
  
  // Eliminar el usuario ID 1 (duplicado)
  console.log('\n🗑️ Eliminando usuario duplicado (ID: 1)...');
  db.run("DELETE FROM Usuarios WHERE usuario_id = 1 AND email = 'medico1@saludigital.edu.co'", function(err) {
    if (err) {
      console.error('❌ Error eliminando usuario:', err.message);
    } else {
      console.log(`✅ Usuario eliminado exitosamente. Filas afectadas: ${this.changes}`);
      
      // Verificar que solo queda el usuario ID 5
      console.log('\n🔍 Verificando usuarios restantes:');
      db.all("SELECT * FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, usuariosRestantes) => {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log(`📋 Usuarios restantes: ${usuariosRestantes.length}`);
          usuariosRestantes.forEach(user => {
            console.log(`   - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}`);
          });
          
          console.log('\n🎯 ¡LISTO!');
          console.log('1. Reinicia el backend');
          console.log('2. Inicia sesión con: medico1@saludigital.edu.co / 1000000001');
          console.log('3. Ahora debería usar ID 5 y ver las demandas inducidas');
        }
        
        db.close();
      });
    }
  });
});
