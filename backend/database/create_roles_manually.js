const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

// Crear tabla Roles
const createRolesTable = `
  CREATE TABLE IF NOT EXISTS Roles (
    rol_id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_rol VARCHAR(100) NOT NULL UNIQUE
  )
`;

db.run(createRolesTable, (err) => {
  if (err) {
    console.error('Error creando tabla Roles:', err.message);
  } else {
    console.log('✅ Tabla Roles creada/verificada');
  }
  
  // Insertar roles básicos
  const insertRoles = [
    [1, 'Administrador'],
    [2, 'Médico'],
    [3, 'Auxiliar de Enfermería'],
    [4, 'Enfermero']
  ];
  
  let completed = 0;
  insertRoles.forEach(([id, nombre]) => {
    db.run('INSERT OR IGNORE INTO Roles (rol_id, nombre_rol) VALUES (?, ?)', [id, nombre], function(err) {
      if (err) {
        console.error(`Error insertando rol ${nombre}:`, err.message);
      } else if (this.changes > 0) {
        console.log(`✅ Rol "${nombre}" insertado`);
      } else {
        console.log(`ℹ️  Rol "${nombre}" ya existe`);
      }
      
      completed++;
      if (completed === insertRoles.length) {
        // Verificar roles creados
        db.all('SELECT * FROM Roles', (err, rows) => {
          if (err) {
            console.error('Error consultando roles:', err.message);
          } else {
            console.log('\n📋 Roles disponibles:');
            rows.forEach(rol => {
              console.log(`  - ${rol.nombre_rol} (ID: ${rol.rol_id})`);
            });
          }
          db.close();
        });
      }
    });
  });
});
