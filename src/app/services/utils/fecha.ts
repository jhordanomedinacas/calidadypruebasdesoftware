// ============================================================
// Helper de formato de fechas
// El backend serializa LocalDateTime como string ISO sin timezone
// (ej: "2025-08-26T10:15:30"). Spring Boot usa la hora del servidor
// que corre en UTC, pero Perú es UTC-5, así que al mostrar fechas
// con hora restamos 5 horas para corregirlo.
// ============================================================

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const OFFSET_PERU_MS = -5 * 60 * 60 * 1000; // UTC-5

/** "26 ago 2025" — solo fecha, sin hora ni corrección de timezone */
export function formatFechaCorta(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '';

  const soloFecha = fechaIso.split('T')[0];
  const partes = soloFecha.split('-');
  if (partes.length !== 3) return fechaIso;

  const [anio, mes, dia] = partes;
  const mesIdx = Number(mes) - 1;
  if (mesIdx < 0 || mesIdx > 11) return fechaIso;

  return `${Number(dia)} ${MESES_CORTOS[mesIdx]} ${anio}`;
}

/** "17 jun 2026 · 02:28" — fecha + hora corregida a UTC-5 (Perú) */
export function formatFechaHora(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '';

  // El ISO viene sin 'Z', lo forzamos a UTC sumándole la Z
  const utcStr = fechaIso.includes('Z') ? fechaIso : fechaIso + 'Z';
  const utcMs  = new Date(utcStr).getTime();
  if (isNaN(utcMs)) return fechaIso;

  const peruMs = utcMs + OFFSET_PERU_MS;
  const d      = new Date(peruMs);

  const dia  = d.getUTCDate();
  const mes  = MESES_CORTOS[d.getUTCMonth()];
  const anio = d.getUTCFullYear();
  const hh   = String(d.getUTCHours()).padStart(2, '0');
  const mm   = String(d.getUTCMinutes()).padStart(2, '0');

  return `${dia} ${mes} ${anio} · ${hh}:${mm}`;
}