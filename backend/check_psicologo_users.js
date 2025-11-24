const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a SQLite:', err.message);
    process.exit(1);
  }
});

console.log('🔍 Buscando usuarios de Psicología...\n');

// Primero buscar el rol_id de Psicólogo
db.get("SELECT rol_id FROM Roles WHERE nombre_rol LIKE '%Psic%' OR nombre_rol LIKE '%psic%'", (err, rolRow) => {
  if (err) {
    console.error('❌ Error:', err.message);
    db.close();
    return;
  }

  if (!rolRow) {
    console.log('⚠️  No se encontró el rol de Psicólogo.');
    console.log('📝 Creando el rol...\n');
    
    db.run("INSERT INTO Roles (nombre_rol) VALUES ('Psicólogo')", function(err) {
      if (err) {
        console.error('❌ Error creando rol:', err.message);
        db.close();
        return;
      }
      const rolId = this.lastID;
      console.log('✅ Rol creado con ID:', rolId);
      crearUsuarioPsicologo(rolId);
    });
  } else {
    const rolId = rolRow.rol_id;
    console.log(`✅ Rol encontrado: Psicólogo (ID: ${rolId})\n`);
    
    // Buscar usuarios con ese rol
    const query = `
      SELECT 
        u.usuario_id,
        u.nombre_completo,
        u.email,
        u.numero_documento,
        r.nombre_rol
      FROM Usuarios u
      JOIN Roles r ON u.rol_id = r.rol_id
      WHERE u.rol_id = ?
      ORDER BY u.nombre_completo
    `;
    
    db.all(query, [rolId], (err, rows) => {
      if (err) {
        console.error('❌ Error:', err.message);
        db.close();
        return;
      }

      if (rows.length === 0) {
        console.log('⚠️  No se encontraron usuarios de psicología.');
        console.log('\n📝 Creando un usuario psicólogo de ejemplo...\n');
        crearUsuarioPsicologo(rolId);
      } else {
        console.log(`✅ Encontrados ${rows.length} usuario(s) de psicología:\n`);
        rows.forEach((user, index) => {
          console.log(`${index + 1}. ${user.nombre_completo}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Documento: ${user.numero_documento}`);
          console.log(`   Rol: ${user.nombre_rol}`);
          console.log('');
        });
        
        // Mostrar credenciales conocidas
        const psicologoUser = rows.find(u => u.email === 'psicologo@salud.com');
        if (psicologoUser) {
          console.log('🔑 Credenciales de acceso:');
          console.log('   Email: psicologo@salud.com');
          console.log('   Contraseña: psic123');
          console.log('');
        }
        db.close();
      }
    });
  }
});

async function crearUsuarioPsicologo(rolId) {
  try {
    // El sistema usa numero_documento como contraseña
    const password = 'psic123';
    const numeroDocumento = password;

    // Verificar si la tabla tiene password_hash
    db.all("PRAGMA table_info(Usuarios)", (err, columns) => {
      if (err) {
        console.error('❌ Error verificando estructura:', err.message);
        db.close();
        return;
      }

      const hasPasswordHash = columns.some(col => col.name === 'password_hash');
      
      let insertQuery, params;
      
      if (hasPasswordHash) {
        // Si tiene password_hash, usar bcrypt
        bcrypt.hash(password, 10).then(passwordHash => {
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
            'Ana Psicóloga',
            'psicologo@salud.com',
            passwordHash,
            numeroDocumento,
            rolId,
            1  // activo
          ];
          
          ejecutarInsert(insertQuery, params);
        });
      } else {
        // Si no tiene password_hash, usar solo numero_documento
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
          'Ana Psicóloga',
          'psicologo@salud.com',
          numeroDocumento,
          rolId,
          1  // activo
        ];
        
        ejecutarInsert(insertQuery, params);
      }
    });
  } catch (error) {
    console.error('❌ Error en crearUsuarioPsicologo:', error);
    db.close();
  }
}

function ejecutarInsert(insertQuery, params) {
  db.run(insertQuery, params, function(err) {
    if (err) {
      console.error('❌ Error creando usuario:', err.message);
    } else {
      console.log('✅ Usuario psicólogo creado:');
      console.log('   Email: psicologo@salud.com');
      console.log('   Contraseña: psic123');
      console.log('   Rol: Psicólogo\n');
    }
    db.close();
  });
}

