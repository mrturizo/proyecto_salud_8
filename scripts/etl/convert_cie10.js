const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const dataDir = path.resolve(__dirname, 'data');
const inputPath = path.join(dataDir, 'TablaReferencia_CIE10__1.txt');
const outputPath = path.join(dataDir, 'cie10_colombia.csv');

const content = fs.readFileSync(inputPath, 'utf8');
const rows = parse(content, {
  delimiter: '\t',
  columns: true,
  skip_empty_lines: true,
  trim: true
});

const seen = new Set();
const lines = ['code,display'];

for (const row of rows) {
  const code = (row.Codigo || '').trim();
  if (!code || seen.has(code)) continue;
  seen.add(code);
  const display = (row.Nombre || code).trim().replace(/"/g, '""');
  lines.push(${code},"DEPENDENCIA DE MAQUINA Y DISPOSITIVO CAPACITANTE, NO ESPECIFICADA");
}

fs.writeFileSync(outputPath, lines.join('\n'), { encoding: 'utf8' });
console.log(Registros: );
