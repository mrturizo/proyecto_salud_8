#!/usr/bin/env node

/**
 * Carga catálogos mínimos (CIE10, medicamentos INVIMA/ATC) en Ontoserver.
 * Uso:
 *   node scripts/etl/loadTerminology.js --baseUrl=http://localhost:8180/fhir
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const args = Object.fromEntries(
  process.argv.slice(2).map(arg => {
    const [key, value] = arg.split('=');
    return [key.replace(/^--/, ''), value ?? true];
  })
);

const BASE_URL = args.baseUrl || process.env.ONTO_BASE_URL || 'http://localhost:8180/fhir';

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo no encontrado: ${filePath}`);
  }
  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

function findColumn(headers, candidates) {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  for (const candidate of candidates) {
    const idx = lowerHeaders.indexOf(candidate.toLowerCase());
    if (idx >= 0) {
      return headers[idx];
    }
  }
  return null;
}

function normalizeCIE10Rows(rows) {
  if (!rows || rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const codeColumn = findColumn(headers, ['codigodx', 'codigo', 'code', 'cod_cie10', 'cie10']);
  const displayColumn = findColumn(headers, ['descripciondx', 'descripcion', 'display', 'desc_cie10', 'diagnostico']);

  if (!codeColumn || !displayColumn) {
    throw new Error('No se pudieron identificar las columnas de código y descripción en el CIE10');
  }

  return rows
    .map(row => ({
      code: (row[codeColumn] || '').trim(),
      display: (row[displayColumn] || '').trim()
    }))
    .filter(row => row.code && row.display);
}

function normalizeMedicationRows(rows) {
  if (!rows || rows.length === 0) return [];

  const headers = Object.keys(rows[0]);
  const codeColumn = findColumn(headers, ['expedientecum', 'expediente', 'consecutivocum', 'codigo_cum', 'registrosanitario', 'ium']);
  const displayColumn = findColumn(
    headers,
    ['descripcioncomercial', 'producto', 'presentacion', 'nombre', 'descripcion']
  );
  const atcColumn = findColumn(headers, ['atc', 'codigoatc', 'codatc']);
  const atcDescColumn = findColumn(headers, ['descripcionatc', 'desc_atc']);

  if (!codeColumn || !displayColumn) {
    throw new Error('No se pudieron identificar las columnas de código INVIMA y descripción del CUM');
  }

  return rows
    .map(row => {
      const code = (row[codeColumn] || '').toString().trim();
      const display = (row[displayColumn] || '').trim();
      const atc =
        (row[atcColumn] || '').toString().trim() ||
        (row[atcDescColumn] || '').toString().trim();

      return {
        code,
        display,
        atc: atc || undefined
      };
    })
    .filter(row => row.code && row.display);
}

async function upsertResource(resourceType, resource) {
  const url = `${BASE_URL}/${resourceType}/${resource.id}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/fhir+json'
    },
    body: JSON.stringify(resource)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error publicando ${resourceType}/${resource.id}: ${res.status} ${res.statusText} -> ${text}`);
  }

  console.log(`✅ ${resourceType}/${resource.id} cargado correctamente`);
}

async function main() {
  console.log('🚀 Iniciando carga de terminologías en Ontoserver');
  console.log(`➡️  URL base: ${BASE_URL}`);

  // === CIE10 ===
  const dataDirectories = [
    path.join(__dirname, 'data'), // ubicación legacy
    path.join(__dirname, '../../backend/terminology-data') // nueva ubicación dentro del backend
  ];

  const cie10FileCandidates = ['cie10_colombia.csv', 'cie10_subset.csv'];
  let cie10RowsRaw = [];
  let cie10Source = null;
  for (const fileName of cie10FileCandidates) {
    for (const dir of dataDirectories) {
      const filePath = path.join(dir, fileName);
      if (fs.existsSync(filePath)) {
        cie10RowsRaw = readCsv(filePath);
        cie10Source = fileName;
        break;
      }
    }
    if (cie10Source) break;
  }

  if (!cie10Source) {
    throw new Error('No se encontró ningún archivo de CIE10 en scripts/etl/data ni backend/terminology-data');
  }

  const cie10Rows = normalizeCIE10Rows(cie10RowsRaw);
  console.log(`📚 CIE10 cargado desde ${cie10Source} (${cie10Rows.length} códigos)`);

  const cie10CodeSystem = {
    resourceType: 'CodeSystem',
    id: cie10Source === 'cie10_subset.csv' ? 'cie10-colombia-demo' : 'cie10-colombia-oficial',
    url: 'https://terminology.salud.gov.co/cie10',
    version: cie10Source === 'cie10_subset.csv' ? '2025-demo' : '2025-oficial',
    name: cie10Source === 'cie10_subset.csv' ? 'CIE10ColombiaDemo' : 'CIE10ColombiaOficial',
    title: cie10Source === 'cie10_subset.csv' ? 'CIE10 Colombia (subset demo)' : 'CIE10 Colombia (catálogo oficial)',
    status: 'active',
    content: 'complete',
    concept: cie10Rows.map(row => ({
      code: row.code,
      display: row.display
    }))
  };

  await upsertResource('CodeSystem', cie10CodeSystem);

  const cie10ValueSet = {
    resourceType: 'ValueSet',
    id: cie10Source === 'cie10_subset.csv' ? 'vs-cie10-colombia-demo' : 'vs-cie10-colombia-oficial',
    url: cie10Source === 'cie10_subset.csv'
      ? 'https://terminology.salud.gov.co/ValueSet/cie10-demo'
      : 'https://terminology.salud.gov.co/ValueSet/cie10-oficial',
    version: cie10Source === 'cie10_subset.csv' ? '2025-demo' : '2025-oficial',
    name: cie10Source === 'cie10_subset.csv' ? 'VSCIE10ColombiaDemo' : 'VSCIE10ColombiaOficial',
    status: 'active',
    compose: {
      include: [
        {
          system: cie10CodeSystem.url
        }
      ]
    }
  };

  await upsertResource('ValueSet', cie10ValueSet);

  // === Medicamentos ===
  const medsFileCandidates = ['cum_medicamentos.csv', 'meds_subset.csv'];
  let medsRowsRaw = [];
  let medsSource = null;
  for (const fileName of medsFileCandidates) {
    for (const dir of dataDirectories) {
      const filePath = path.join(dir, fileName);
      if (fs.existsSync(filePath)) {
        medsRowsRaw = readCsv(filePath);
        medsSource = fileName;
        break;
      }
    }
    if (medsSource) break;
  }

  if (!medsSource) {
    throw new Error('No se encontró ningún archivo de medicamentos en scripts/etl/data ni backend/terminology-data');
  }

  const medsRows = normalizeMedicationRows(medsRowsRaw);
  console.log(`💊 CUM cargado desde ${medsSource} (${medsRows.length} códigos)`);

  const medsCodeSystem = {
    resourceType: 'CodeSystem',
    id: medsSource === 'meds_subset.csv' ? 'invima-demo' : 'invima-colombia-oficial',
    url: 'https://terminology.salud.gov.co/medicamentos/invima',
    version: medsSource === 'meds_subset.csv' ? '2025-demo' : '2025-oficial',
    name: medsSource === 'meds_subset.csv' ? 'INVIMADemo' : 'INVIMAColombiaOficial',
    title: medsSource === 'meds_subset.csv' ? 'Medicamentos INVIMA demo' : 'Medicamentos INVIMA (catálogo oficial)',
    status: 'active',
    content: 'complete',
    concept: medsRows.map(row => ({
      code: row.code,
      display: row.display,
      designation: row.atc
        ? [
            {
              language: 'es',
              use: {
                system: 'http://terminology.hl7.org/CodeSystem/designation-use',
                code: 'synonym'
              },
              value: `ATC ${row.atc}`
            }
          ]
        : undefined
    }))
  };

  await upsertResource('CodeSystem', medsCodeSystem);

  const medsValueSet = {
    resourceType: 'ValueSet',
    id: medsSource === 'meds_subset.csv' ? 'vs-medicamentos-invima-demo' : 'vs-medicamentos-invima-oficial',
    url: medsSource === 'meds_subset.csv'
      ? 'https://terminology.salud.gov.co/ValueSet/medicamentos-demo'
      : 'https://terminology.salud.gov.co/ValueSet/medicamentos-oficial',
    version: medsSource === 'meds_subset.csv' ? '2025-demo' : '2025-oficial',
    name: medsSource === 'meds_subset.csv' ? 'VSINVIMADemo' : 'VSINVIMAColombiaOficial',
    status: 'active',
    compose: {
      include: [
        {
          system: medsCodeSystem.url
        }
      ]
    }
  };

  await upsertResource('ValueSet', medsValueSet);
  console.log('🎉 Terminologías cargadas exitosamente.');
}

main().catch(err => {
  console.error('❌ Error en la carga de terminologías:', err.message);
  process.exit(1);
});

