// backend/verificar_datos_originales.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('🔍 VERIFICANDO DATOS ORIGINALES DETALLADOS');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos original');
});

// Verificar estructura y datos de cada tabla
async function verificarDatosDetallados() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO ESTRUCTURA Y DATOS DETALLADOS');
  console.log('='.repeat(60));

  // 1. Verificar Usuarios
  console.log('\n👥 USUARIOS:');
  db.all("SELECT * FROM Usuarios", (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log(`   📊 Total: ${rows.length} usuarios`);
      rows.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.usuario_id}, Nombre: ${user.nombre_completo}, Email: ${user.email}, Rol: ${user.rol_id}`);
      });
    }

    // 2. Verificar Roles
    console.log('\n🎭 ROLES:');
    db.all("SELECT * FROM Roles", (err, rows) => {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log(`   📊 Total: ${rows.length} roles`);
        rows.forEach((role, index) => {
          console.log(`   ${index + 1}. ID: ${role.rol_id}, Nombre: ${role.nombre_rol}`);
        });
      }

      // 3. Verificar Familias
      console.log('\n👨‍👩‍👧‍👦 FAMILIAS:');
      db.all("SELECT * FROM Familias", (err, rows) => {
        if (err) {
          console.error('Error:', err);
        } else {
          console.log(`   📊 Total: ${rows.length} familias`);
          rows.forEach((familia, index) => {
            console.log(`   ${index + 1}. ID: ${familia.familia_id}, Apellido: ${familia.apellido_principal}, Municipio: ${familia.municipio}`);
            console.log(`      - Dirección: ${familia.direccion}`);
            console.log(`      - Barrio: ${familia.barrio_vereda}`);
            console.log(`      - Teléfono: ${familia.telefono_contacto}`);
            console.log(`      - Creado por UID: ${familia.creado_por_uid}`);
            console.log(`      - Fecha creación: ${familia.fecha_creacion}`);
            console.log(`      - Activo: ${familia.activo}`);
          });
        }

        // 4. Verificar Pacientes
        console.log('\n🏥 PACIENTES:');
        db.all("SELECT * FROM Pacientes", (err, rows) => {
          if (err) {
            console.error('Error:', err);
          } else {
            console.log(`   📊 Total: ${rows.length} pacientes`);
            rows.forEach((paciente, index) => {
              console.log(`   ${index + 1}. ID: ${paciente.paciente_id}, Nombre: ${paciente.primer_nombre} ${paciente.primer_apellido}`);
              console.log(`      - Documento: ${paciente.numero_documento} (${paciente.tipo_documento})`);
              console.log(`      - Fecha nacimiento: ${paciente.fecha_nacimiento}`);
              console.log(`      - Género: ${paciente.genero}`);
              console.log(`      - Familia ID: ${paciente.familia_id}`);
              console.log(`      - Activo: ${paciente.activo}`);
            });
          }

          // 5. Verificar Demandas Inducidas
          console.log('\n📋 DEMANDAS INDUCIDAS:');
          db.all("SELECT * FROM Demandas_Inducidas", (err, rows) => {
            if (err) {
              console.error('Error:', err);
            } else {
              console.log(`   📊 Total: ${rows.length} demandas`);
              rows.forEach((demanda, index) => {
                console.log(`   ${index + 1}. ID: ${demanda.demanda_id}`);
                console.log(`      - Descripción: ${demanda.descripcion}`);
                console.log(`      - Prioridad: ${demanda.prioridad}`);
                console.log(`      - Estado: ${demanda.estado}`);
                console.log(`      - Fecha creación: ${demanda.fecha_creacion}`);
                console.log(`      - Fecha límite: ${demanda.fecha_limite}`);
                console.log(`      - Plan ID: ${demanda.plan_id}`);
                console.log(`      - Paciente ID: ${demanda.paciente_id}`);
              });
            }

            console.log('\n' + '='.repeat(60));
            console.log('✅ VERIFICACIÓN COMPLETADA');
            console.log('='.repeat(60));
            
            db.close();
          });
        });
      });
    });
  });
}

verificarDatosDetallados().catch(console.error);
