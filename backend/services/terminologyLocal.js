const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// FUNCIONES VACÍAS - NO ejecuta código al cargar
function searchCIE10(query, limit) {
  console.log('[Terminology] Búsqueda CIE10 desactivada temporalmente');
  return [];
}

function searchMedications(query, limit) {
  console.log('[Terminology] Búsqueda medicamentos desactivada temporalmente');
  return [];
}

// SOLO exportar funciones - NO ejecutar código
module.exports = {
  searchCIE10,
  searchMedications
};