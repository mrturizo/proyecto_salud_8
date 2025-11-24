const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('salud_digital_aps.db', (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

async function fixCarlosCredentials() {
  try {
    const email = 'medico1@saludigital.edu.co';
    const password = '1000000001'; // La contraseña que esperas
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si Dr. Carlos Mendoza ya existe
    db.get("SELECT usuario_id FROM Usuarios WHERE email = ?", [email], async (err, existingUser) => {
      if (err) {
        console.error('Error verificando usuario:', err);
        db.close();
        return;
      }

      if (existingUser) {
        console.log(`✅ Dr. Carlos Mendoza ya existe con ID: ${existingUser.usuario_id}`);
        
        // Actualizar la contraseña para que use el sistema de hash
        const updateQuery = `
          UPDATE Usuarios 
          SET numero_documento = ?, password_hash = ?
          WHERE email = ?
        `;
        
        db.run(updateQuery, [password, hashedPassword, email], function(err) {
          if (err) {
            console.error('Error actualizando credenciales:', err);
          } else {
            console.log('✅ Credenciales actualizadas exitosamente');
            console.log(`📧 Email: ${email}`);
            console.log(`🔑 Contraseña: ${password}`);
            console.log(`🆔 ID: ${existingUser.usuario_id}`);
            console.log('\n🎯 ¡LISTO PARA PROBAR!');
            console.log('1. Reinicia el backend');
            console.log('2. Inicia sesión con: medico1@saludigital.edu.co / 1000000001');
            console.log('3. Ve a "Consultas Asignadas" → "Demandas Inducidas"');
          }
          db.close();
        });
      } else {
        console.log('❌ Dr. Carlos Mendoza no existe');
        db.close();
      }
    });

  } catch (error) {
    console.error('Error en fixCarlosCredentials:', error);
    db.close();
  }
}

fixCarlosCredentials();
