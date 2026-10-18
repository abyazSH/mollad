export function csvCell(value: string | number) {
  let text = String(value);
  if (typeof value === 'string' && /^[\s]*[=+\-@\t\r\n]/.test(text))
    text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
export function toCsv(rows: (string | number)[][]) {
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}
