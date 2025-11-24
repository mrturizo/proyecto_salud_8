const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  }
});

console.log('🔍 Buscando usuarios de Enfermero Jefe...\n');

// Primero buscar el rol_id de Enfermero Jefe
db.get("SELECT rol_id FROM Roles WHERE nombre_rol LIKE '%Enfermero Jefe%' OR nombre_rol LIKE '%enfermero jefe%'", (err, rolRow) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  let rolId;
  if (!rolRow) {
    console.log('⚠️  No se encontró el rol de Enfermero Jefe.');
    console.log('📝 Creando el rol...\n');
    
    db.run("INSERT INTO Roles (nombre_rol) VALUES ('Enfermero Jefe')", function(err) {
      if (err) {
        console.error('❌ Error creando rol:', err.message);
        db.close();
        return;
      }
      rolId = this.lastID;
      console.log(`✅ Rol 'Enfermero Jefe' creado con ID: ${rolId}\n`);
      checkAndCreateEnfermeroJefeUser(rolId);
    });
  } else {
    rolId = rolRow.rol_id;
    console.log(`✅ Rol 'Enfermero Jefe' encontrado con ID: ${rolId}\n`);
    checkAndCreateEnfermeroJefeUser(rolId);
  }
});

function checkAndCreateEnfermeroJefeUser(rolId) {
  const email = 'enfermerojefe@salud.com';
  const numeroDocumento = '11223344'; // Usaremos esto como contraseña

  db.get("SELECT * FROM Usuarios WHERE email = ?", [email], (err, userRow) => {
    if (err) {
      console.error('❌ Error buscando usuario:', err.message);
      db.close();
      return;
    }

    if (!userRow) {
      console.log(`⚠️  No se encontró el usuario '${email}'.`);
      console.log('📝 Creando usuario de Enfermero Jefe...\n');

      // Verificar estructura de la tabla
      db.all("PRAGMA table_info(Usuarios)", (err, columns) => {
        if (err) {
          console.error('❌ Error verificando estructura:', err.message);
          db.close();
          return;
        }

        const columnNames = columns.map(col => col.name);
        const hasPasswordHash = columnNames.includes('password_hash');
        
        let insertQuery, params;
        
        if (hasPasswordHash) {
          insertQuery = `
            INSERT INTO Usuarios (
              nombre_completo, 
              email, 
              password_hash, 
              numero_documento, 
              rol_id,
              activo
            ) VALUES (?, ?, ?, ?, ?, ?)
          `;
          
          params = [
            'Jefe Enfermero',
            email,
            numeroDocumento, // El sistema usa numero_documento como password
            numeroDocumento,
            rolId,
            1  // activo
          ];
        } else {
          insertQuery = `
            INSERT INTO Usuarios (
              nombre_completo, 
              email, 
              numero_documento, 
              rol_id,
              activo
            ) VALUES (?, ?, ?, ?, ?)
          `;
          
          params = [
            'Jefe Enfermero',
            email,
            numeroDocumento,
            rolId,
            1  // activo
          ];
        }

        db.run(insertQuery, params, function(err) {
          if (err) {
            console.error('❌ Error creando usuario:', err.message);
          } else {
            console.log('✅ Usuario Enfermero Jefe creado:');
            console.log(`   Email: ${email}`);
            console.log(`   Contraseña: ${numeroDocumento}`);
            console.log('   Rol: Enfermero Jefe\n');
          }
          db.close();
        });
      });
    } else {
      console.log(`✅ Usuario Enfermero Jefe '${email}' ya existe.`);
      console.log('🔑 Credenciales de acceso:');
      console.log(`   Email: ${email}`);
      console.log(`   Contraseña: ${numeroDocumento}`);
      console.log('   Rol: Enfermero Jefe\n');
      db.close();
    }
  });
}

