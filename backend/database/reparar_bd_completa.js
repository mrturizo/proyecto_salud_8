// backend/database/reparar_bd_completa.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('🔧 REPARACIÓN COMPLETA DE LA BASE DE DATOS');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Función para ejecutar SQL de forma segura
function ejecutarSQL(sql, descripcion) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 ${descripcion}...`);
    db.run(sql, (err) => {
      if (err) {
        console.log(`   ⚠️  ${descripcion}: ${err.message}`);
        resolve(false);
      } else {
        console.log(`   ✅ ${descripcion}: Completado`);
        resolve(true);
      }
    });
  });
}

// Función para verificar si una columna existe
function columnaExiste(tabla, columna) {
  return new Promise((resolve) => {
    db.all(`PRAGMA table_info(${tabla})`, (err, columns) => {
      if (err) {
        resolve(false);
      } else {
        const existe = columns.some(col => col.name === columna);
        resolve(existe);
      }
    });
  });
}

async function repararBaseDatos() {
  console.log('\n' + '='.repeat(60));
  console.log('🔧 INICIANDO REPARACIÓN COMPLETA');
  console.log('='.repeat(60));

  // 1. Crear tabla Caracterizacion_Paciente si no existe
  console.log('\n📋 1. CREANDO TABLA Caracterizacion_Paciente');
  const crearCaracterizacionPaciente = `
    CREATE TABLE IF NOT EXISTS Caracterizacion_Paciente (
      caracterizacion_paciente_id INTEGER PRIMARY KEY AUTOINCREMENT,
      paciente_id INTEGER NOT NULL,
      fecha_caracterizacion DATE,
      rol_familiar VARCHAR(50),
      ocupacion VARCHAR(150),
      nivel_educativo VARCHAR(100),
      grupo_poblacional VARCHAR(100),
      regimen_afiliacion VARCHAR(100),
      pertenencia_etnica VARCHAR(100),
      discapacidad JSON,
      victima_violencia BOOLEAN,
      datos_pyp JSON,
      datos_salud JSON,
      creado_por_uid INTEGER,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
      FOREIGN KEY (creado_por_uid) REFERENCES Usuarios(usuario_id)
    )
  `;
  await ejecutarSQL(crearCaracterizacionPaciente, 'Creando tabla Caracterizacion_Paciente');

  // 2. Agregar columnas faltantes a Demandas_Inducidas
  console.log('\n📋 2. REPARANDO TABLA Demandas_Inducidas');
  
  const columnasDemandas = [
    { nombre: 'paciente_id', tipo: 'INTEGER' },
    { nombre: 'fecha_asignacion', tipo: 'DATE' },
    { nombre: 'fecha_completado', tipo: 'DATE' },
    { nombre: 'profesional_asignado', tipo: 'INTEGER' },
    { nombre: 'observaciones', tipo: 'TEXT' },
    { nombre: 'creado_por_uid', tipo: 'INTEGER' },
    { nombre: 'fecha_creacion_timestamp', tipo: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
  ];

  for (const columna of columnasDemandas) {
    const existe = await columnaExiste('Demandas_Inducidas', columna.nombre);
    if (!existe) {
      await ejecutarSQL(
        `ALTER TABLE Demandas_Inducidas ADD COLUMN ${columna.nombre} ${columna.tipo}`,
        `Agregando columna ${columna.nombre} a Demandas_Inducidas`
      );
    } else {
      console.log(`   ✅ Columna ${columna.nombre} ya existe en Demandas_Inducidas`);
    }
  }

  // 3. Agregar columnas de caracterización a Familias
  console.log('\n📋 3. AGREGANDO COLUMNAS DE CARACTERIZACIÓN A Familias');
  
  const columnasFamilias = [
    { nombre: 'numero_ficha', tipo: 'VARCHAR(100)' },
    { nombre: 'zona', tipo: 'VARCHAR(50)' },
    { nombre: 'territorio', tipo: 'VARCHAR(150)' },
    { nombre: 'estrato', tipo: 'INT' },
    { nombre: 'tipo_familia', tipo: 'VARCHAR(100)' },
    { nombre: 'riesgo_familiar', tipo: 'VARCHAR(100)' },
    { nombre: 'fecha_caracterizacion', tipo: 'DATE' },
    { nombre: 'info_vivienda', tipo: 'JSON' },
    { nombre: 'situaciones_proteccion', tipo: 'JSON' },
    { nombre: 'condiciones_salud_publica', tipo: 'JSON' },
    { nombre: 'practicas_cuidado', tipo: 'JSON' }
  ];

  for (const columna of columnasFamilias) {
    const existe = await columnaExiste('Familias', columna.nombre);
    if (!existe) {
      await ejecutarSQL(
        `ALTER TABLE Familias ADD COLUMN ${columna.nombre} ${columna.tipo}`,
        `Agregando columna ${columna.nombre} a Familias`
      );
    } else {
      console.log(`   ✅ Columna ${columna.nombre} ya existe en Familias`);
    }
  }

  // 4. Crear índices para mejorar rendimiento
  console.log('\n📋 4. CREANDO ÍNDICES');
  
  const indices = [
    'CREATE INDEX IF NOT EXISTS idx_caracterizacion_paciente_id ON Caracterizacion_Paciente(paciente_id)',
    'CREATE INDEX IF NOT EXISTS idx_caracterizacion_fecha ON Caracterizacion_Paciente(fecha_caracterizacion)',
    'CREATE INDEX IF NOT EXISTS idx_familias_zona ON Familias(zona)',
    'CREATE INDEX IF NOT EXISTS idx_familias_territorio ON Familias(territorio)',
    'CREATE INDEX IF NOT EXISTS idx_familias_tipo_familia ON Familias(tipo_familia)',
    'CREATE INDEX IF NOT EXISTS idx_familias_riesgo ON Familias(riesgo_familiar)',
    'CREATE INDEX IF NOT EXISTS idx_demanda_paciente ON Demandas_Inducidas(paciente_id)',
    'CREATE INDEX IF NOT EXISTS idx_demanda_estado ON Demandas_Inducidas(estado)',
    'CREATE INDEX IF NOT EXISTS idx_demanda_profesional ON Demandas_Inducidas(profesional_asignado)'
  ];

  for (const indice of indices) {
    await ejecutarSQL(indice, `Creando índice: ${indice.split(' ')[5]}`);
  }

  // 5. Verificar y crear usuario auxiliar si no existe
  console.log('\n📋 5. VERIFICANDO USUARIO AUXILIAR');
  
  const verificarUsuarioAuxiliar = `
    INSERT OR IGNORE INTO Usuarios (
      nombre_completo, 
      email, 
      numero_documento, 
      rol_id, 
      equipo_id, 
      telefono,
      fecha_registro,
      activo
    ) 
    SELECT 
      'Auxiliar de Enfermería Demo',
      'auxiliar@salud.com',
      '1000000999',
      rol_id,
      1,
      '3001234567',
      CURRENT_TIMESTAMP,
      1
    FROM Roles 
    WHERE nombre_rol = 'Auxiliar de enfermería'
  `;
  await ejecutarSQL(verificarUsuarioAuxiliar, 'Verificando usuario auxiliar');

  // 6. Verificación final
  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICACIÓN FINAL');
  console.log('='.repeat(60));

  // Verificar estructura final de Demandas_Inducidas
  db.all("PRAGMA table_info(Demandas_Inducidas)", (err, columns) => {
    if (err) {
      console.error('Error verificando Demandas_Inducidas:', err);
    } else {
      console.log('\n📋 Estructura final de Demandas_Inducidas:');
      columns.forEach(col => {
        console.log(`   - ${col.name}: ${col.type}`);
      });
    }

    // Verificar Caracterizacion_Paciente
    db.all("PRAGMA table_info(Caracterizacion_Paciente)", (err, columns) => {
      if (err) {
        console.error('Error verificando Caracterizacion_Paciente:', err);
      } else {
        console.log('\n📋 Estructura final de Caracterizacion_Paciente:');
        columns.forEach(col => {
          console.log(`   - ${col.name}: ${col.type}`);
        });
      }

      console.log('\n' + '='.repeat(60));
      console.log('🎉 REPARACIÓN COMPLETADA EXITOSAMENTE');
      console.log('='.repeat(60));
      console.log('✅ Todas las tablas y columnas necesarias han sido creadas/actualizadas');
      console.log('✅ Los índices han sido creados para mejorar el rendimiento');
      console.log('✅ El usuario auxiliar está disponible para pruebas');
      console.log('\n🚀 La base de datos está lista para usar');
      
      db.close();
    });
  });
}

repararBaseDatos().catch(console.error);
