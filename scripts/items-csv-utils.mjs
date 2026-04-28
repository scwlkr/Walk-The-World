import fs from 'node:fs';

const splitCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const stringifyCsvValue = (value) => {
  const text = value == null ? '' : String(value);
  if (!text.includes(',') && !text.includes('"') && !text.includes('\n')) return text;
  return `"${text.replaceAll('"', '""')}"`;
};

export const readCsv = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const row = {};
    for (let i = 0; i < headers.length; i += 1) {
      row[headers[i]] = cols[i] ?? '';
    }
    return row;
  });

  return { headers, rows };
};

export const writeCsv = (filePath, headers, rows) => {
  const headerLine = headers.map(stringifyCsvValue).join(',');
  const body = rows
    .map((row) => headers.map((header) => stringifyCsvValue(row[header] ?? '')).join(','))
    .join('\n');
  const next = body.length > 0 ? `${headerLine}\n${body}\n` : `${headerLine}\n`;
  fs.writeFileSync(filePath, next, 'utf8');
};
