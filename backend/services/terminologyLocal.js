const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Cache de datos cargados
let cie10Data = null;
let medicationsData = null;

// Función para cargar datos de CIE10
function loadCIE10Data() {
  if (cie10Data !== null) return cie10Data;

  // Intentar diferentes rutas posibles
  const possiblePaths = [
    // Nuevos archivos ubicados dentro del backend para entornos productivos
    path.join(__dirname, '../terminology-data'),
    // Rutas heredadas (mantener por compatibilidad local)
    path.join(__dirname, '../../scripts/etl/data'),
    path.join(process.cwd(), 'scripts/etl/data'),
    path.join(process.cwd(), 'backend/scripts/etl/data')
  ];
  
  const fileCandidates = ['cie10_colombia.csv', 'cie10_subset.csv'];
  
  for (const fileName of fileCandidates) {
    for (const dataDir of possiblePaths) {
      const filePath = path.join(dataDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const rows = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
          });
          cie10Data = rows
            .map(row => ({
              code: (row.code || row.codigo || '').trim(),
              display: (row.display || row.descripcion || '').trim()
            }))
            .filter(row => row.code && row.display);
          console.log(`[Terminology] CIE10 cargado: ${cie10Data.length} códigos desde ${fileName}`);
          return cie10Data;
        } catch (error) {
          console.error(`[Terminology] Error cargando ${fileName}:`, error.message);
        }
        break; // Si encontramos el archivo, salir del loop de rutas
      }
    }
  }

  console.warn('[Terminology] No se encontraron archivos CIE10');
  cie10Data = [];
  return cie10Data;
}

// Función para cargar datos de medicamentos
function loadMedicationsData() {
  if (medicationsData !== null) return medicationsData;

  // Intentar diferentes rutas posibles
  const possiblePaths = [
    // Nuevos archivos ubicados dentro del backend para entornos productivos
    path.join(__dirname, '../terminology-data'),
    // Rutas heredadas (mantener por compatibilidad local)
    path.join(__dirname, '../../scripts/etl/data'),
    path.join(process.cwd(), 'scripts/etl/data'),
    path.join(process.cwd(), 'backend/scripts/etl/data')
  ];
  
  const fileCandidates = ['cum_medicamentos.csv', 'meds_subset.csv'];
  
  for (const fileName of fileCandidates) {
    for (const dataDir of possiblePaths) {
      const filePath = path.join(dataDir, fileName);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const rows = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true
          });
          
          medicationsData = rows
            .map(row => {
              // Buscar código en diferentes columnas posibles
              const code = (row.expedientecum || row.consecutivocum || row.codigo || row.code || '').toString().trim();
              // Usar producto como display principal (más amigable que descripcioncomercial)
              const display = (row.producto || row.descripcioncomercial || row.display || row.descripcion || '').trim();
              const atc = (row.atc || '').toString().trim();
              // Guardar también principioactivo para búsqueda
              const principioActivo = (row.principioactivo || '').trim();
              
              return { code, display, atc, principioActivo };
            })
            .filter(row => row.code && row.display);
          console.log(`[Terminology] Medicamentos cargados: ${medicationsData.length} códigos desde ${fileName}`);
          return medicationsData;
        } catch (error) {
          console.error(`[Terminology] Error cargando ${fileName}:`, error.message);
        }
        break; // Si encontramos el archivo, salir del loop de rutas
      }
    }
  }

  console.warn('[Terminology] No se encontraron archivos de medicamentos');
  medicationsData = [];
  return medicationsData;
}

// Función de búsqueda genérica
function searchData(data, query, limit = 20) {
  if (!query || query.length < 2) return [];
  
  const queryLower = query.toLowerCase().trim();
  const results = [];
  
  for (const item of data) {
    const codeMatch = item.code.toLowerCase().includes(queryLower);
    const displayMatch = item.display.toLowerCase().includes(queryLower);
    // Buscar también en principio activo si existe (para medicamentos)
    const principioMatch = item.principioActivo && item.principioActivo.toLowerCase().includes(queryLower);
    
    if (codeMatch || displayMatch || principioMatch) {
      results.push({
        code: item.code,
        display: item.display,
        system: item.system,
        designation: item.atc ? [{
          language: 'es',
          use: {
            system: 'http://terminology.hl7.org/CodeSystem/designation-use',
            code: 'synonym'
          },
          value: `ATC ${item.atc}`
        }] : undefined
      });
      
      if (results.length >= limit) break;
    }
  }
  
  return results;
}

function searchCIE10(query, limit = 20) {
  const data = loadCIE10Data();
  const results = searchData(data, query, limit);
  return results.map(item => ({
    code: item.code,
    display: item.display,
    system: 'https://terminology.salud.gov.co/cie10'
  }));
}

function searchMedications(query, limit = 20) {
  const data = loadMedicationsData();
  return searchData(data, query, limit).map(item => ({
    code: item.code,
    display: item.display,
    system: 'https://terminology.salud.gov.co/medicamentos/invima',
    designation: item.designation
  }));
}

module.exports = {
  searchCIE10,
  searchMedications
};