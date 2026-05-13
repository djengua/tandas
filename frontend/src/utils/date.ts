export function formatMexicoDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const [datePart] = dateStr.split('T');
  if (!datePart) return '—';
  const [y, m, d] = datePart.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('es-MX');
}
