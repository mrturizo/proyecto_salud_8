// backend/database/verificar_crear_tablas_medicas.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'salud_digital_aps.db');
console.log('🔍 VERIFICANDO Y CREANDO TABLAS MÉDICAS');
console.log('📊 Ruta de BD:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error conectando a la BD:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos');
});

// Función para verificar si una tabla existe
function tablaExiste(nombreTabla) {
  return new Promise((resolve) => {
    db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [nombreTabla], (err, rows) => {
      if (err) {
        resolve(false);
      } else {
        resolve(rows.length > 0);
      }
    });
  });
}

// Función para ejecutar SQL
function ejecutarSQL(sql, descripcion) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔧 ${descripcion}...`);
    db.run(sql, (err) => {
      if (err) {
        console.log(`   ❌ Error: ${err.message}`);
        reject(err);
      } else {
        console.log(`   ✅ ${descripcion}: Completado`);
        resolve(true);
      }
    });
  });
}

async function verificarYCrearTablas() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFICANDO TABLAS MÉDICAS');
  console.log('='.repeat(60));

  // 1. Verificar/Crear tabla Atenciones_Clinicas
  console.log('\n📋 1. VERIFICANDO TABLA Atenciones_Clinicas');
  const existeAtenciones = await tablaExiste('Atenciones_Clinicas');
  
  if (!existeAtenciones) {
    const crearAtenciones = `
      CREATE TABLE IF NOT EXISTS Atenciones_Clinicas (
        atencion_id INTEGER PRIMARY KEY AUTOINCREMENT,
        paciente_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        fecha_atencion DATE NOT NULL,
        tipo_atencion VARCHAR(100) DEFAULT 'Consulta Médica',
        estado VARCHAR(50) DEFAULT 'En proceso',
        observaciones TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
        FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
      )
    `;
    await ejecutarSQL(crearAtenciones, 'Creando tabla Atenciones_Clinicas');
    
    const indiceAtenciones = `
      CREATE INDEX IF NOT EXISTS idx_atencion_paciente ON Atenciones_Clinicas(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_atencion_usuario ON Atenciones_Clinicas(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_atencion_fecha ON Atenciones_Clinicas(fecha_atencion);
    `;
    await ejecutarSQL(indiceAtenciones, 'Creando índices para Atenciones_Clinicas');
  } else {
    console.log('   ✅ Tabla Atenciones_Clinicas ya existe');
  }

  // 2. Verificar/Crear tabla Recetas_Medicas
  console.log('\n📋 2. VERIFICANDO TABLA Recetas_Medicas');
  const existeRecetas = await tablaExiste('Recetas_Medicas');
  
  if (!existeRecetas) {
    const crearRecetas = `
      CREATE TABLE IF NOT EXISTS Recetas_Medicas (
        receta_id INTEGER PRIMARY KEY AUTOINCREMENT,
        atencion_id INTEGER NOT NULL,
        paciente_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        fecha_receta DATE NOT NULL,
        medicamentos JSON NOT NULL,
        indicaciones TEXT,
        estado VARCHAR(50) DEFAULT 'Activa',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_impresion TIMESTAMP,
        FOREIGN KEY (atencion_id) REFERENCES HC_Medicina_General(atencion_id),
        FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
        FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
      )
    `;
    await ejecutarSQL(crearRecetas, 'Creando tabla Recetas_Medicas');
    
    const indiceRecetas = `
      CREATE INDEX IF NOT EXISTS idx_receta_atencion ON Recetas_Medicas(atencion_id);
      CREATE INDEX IF NOT EXISTS idx_receta_paciente ON Recetas_Medicas(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_receta_usuario ON Recetas_Medicas(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_receta_fecha ON Recetas_Medicas(fecha_receta);
    `;
    await ejecutarSQL(indiceRecetas, 'Creando índices para Recetas_Medicas');
  } else {
    console.log('   ✅ Tabla Recetas_Medicas ya existe');
  }

  // 3. Verificar/Crear tabla Ordenes_Laboratorio
  console.log('\n📋 3. VERIFICANDO TABLA Ordenes_Laboratorio');
  const existeOrdenes = await tablaExiste('Ordenes_Laboratorio');
  
  if (!existeOrdenes) {
    const crearOrdenes = `
      CREATE TABLE IF NOT EXISTS Ordenes_Laboratorio (
        orden_id INTEGER PRIMARY KEY AUTOINCREMENT,
        atencion_id INTEGER NOT NULL,
        paciente_id INTEGER NOT NULL,
        usuario_id INTEGER NOT NULL,
        fecha_orden DATE NOT NULL,
        examenes JSON NOT NULL,
        indicaciones_clinicas TEXT,
        estado VARCHAR(50) DEFAULT 'Pendiente',
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_impresion TIMESTAMP,
        FOREIGN KEY (atencion_id) REFERENCES HC_Medicina_General(atencion_id),
        FOREIGN KEY (paciente_id) REFERENCES Pacientes(paciente_id),
        FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id)
      )
    `;
    await ejecutarSQL(crearOrdenes, 'Creando tabla Ordenes_Laboratorio');
    
    const indiceOrdenes = `
      CREATE INDEX IF NOT EXISTS idx_orden_atencion ON Ordenes_Laboratorio(atencion_id);
      CREATE INDEX IF NOT EXISTS idx_orden_paciente ON Ordenes_Laboratorio(paciente_id);
      CREATE INDEX IF NOT EXISTS idx_orden_usuario ON Ordenes_Laboratorio(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_orden_fecha ON Ordenes_Laboratorio(fecha_orden);
    `;
    await ejecutarSQL(indiceOrdenes, 'Creando índices para Ordenes_Laboratorio');
  } else {
    console.log('   ✅ Tabla Ordenes_Laboratorio ya existe');
  }

  // Verificación final
  console.log('\n' + '='.repeat(60));
  console.log('✅ VERIFICACIÓN FINAL');
  console.log('='.repeat(60));

  const tablas = ['Atenciones_Clinicas', 'Recetas_Medicas', 'Ordenes_Laboratorio'];
  
  for (const tabla of tablas) {
    const existe = await tablaExiste(tabla);
    if (existe) {
      db.all(`PRAGMA table_info(${tabla})`, (err, columns) => {
        if (err) {
          console.log(`   ❌ Error verificando ${tabla}:`, err.message);
        } else {
          console.log(`   ✅ ${tabla}: ${columns.length} columnas`);
        }
      });
    } else {
      console.log(`   ❌ ${tabla}: NO EXISTE`);
    }
  }

  setTimeout(() => {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60));
    console.log('✅ Todas las tablas médicas están listas');
    
    db.close();
  }, 1000);
}

verificarYCrearTablas().catch(console.error);

