const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

console.log('\n🔍 VERIFICANDO ESTRUCTURA DE TABLA Usuarios');

// Verificar estructura de la tabla
db.all("PRAGMA table_info(Usuarios)", (err, columns) => {
  if (err) {
    console.error('Error obteniendo estructura:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 Columnas de la tabla Usuarios:');
  columns.forEach(col => {
    console.log(`   - ${col.name}: ${col.type}`);
  });
  
  // Verificar si existe password_hash
  const hasPasswordHash = columns.some(col => col.name === 'password_hash');
  console.log(`\n🔐 ¿Tiene columna password_hash?: ${hasPasswordHash}`);
  
  // Ver datos de Dr. Carlos Mendoza
  console.log('\n📋 Datos de Dr. Carlos Mendoza:');
  db.get("SELECT * FROM Usuarios WHERE email = 'medico1@saludigital.edu.co'", (err, user) => {
    if (err) {
      console.error('Error obteniendo usuario:', err);
    } else if (user) {
      console.log('   Usuario encontrado:');
      Object.keys(user).forEach(key => {
        console.log(`     ${key}: ${user[key]}`);
      });
    } else {
      console.log('   ❌ Usuario no encontrado');
    }
    
    db.close();
  });
});
