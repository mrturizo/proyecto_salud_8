const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Verificar todos los usuarios
db.all("SELECT usuario_id, nombre_completo, email, rol_id FROM Usuarios", (err, usuarios) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  
  console.log('\n👥 Usuarios en la base de datos:');
  usuarios.forEach(user => {
    console.log(`  - ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}, Rol ID: ${user.rol_id}`);
  });
  
  db.close();
});
