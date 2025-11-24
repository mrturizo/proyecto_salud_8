const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database', 'salud_digital_aps.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando:', err.message);
    return;
  }
  console.log('✅ Conectado a la base de datos correcta');
});

console.log('\n🔍 VERIFICANDO PACIENTES EXISTENTES');

db.all("SELECT * FROM Pacientes ORDER BY paciente_id", (err, pacientes) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log(`\n📋 Pacientes existentes (${pacientes.length} total):`);
  
  pacientes.forEach(paciente => {
    console.log(`\n👤 Paciente ID ${paciente.paciente_id}:`);
    console.log(`   - Nombre: ${paciente.primer_nombre} ${paciente.primer_apellido}`);
    console.log(`   - Documento: ${paciente.numero_documento}`);
    console.log(`   - Familia ID: ${paciente.familia_id}`);
    console.log(`   - Activo: ${paciente.activo}`);
  });
  
  db.close();
});
