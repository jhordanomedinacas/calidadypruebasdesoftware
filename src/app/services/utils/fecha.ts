// ============================================================
// Helper de formato de fechas
// El backend serializa LocalDateTime/LocalDate como string ISO
// (ej: "2025-08-26T10:15:30" o "2025-08-26"). Esta función lo
// convierte al formato corto usado en las cards: "26 ago 2025".
// ============================================================

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

export function formatFechaCorta(fechaIso: string | null | undefined): string {
  if (!fechaIso) return '';

  // Tomamos solo la parte de fecha (YYYY-MM-DD) para evitar problemas
  // de timezone al parsear con `new Date(...)`.
  const soloFecha = fechaIso.split('T')[0];
  const partes = soloFecha.split('-');
  if (partes.length !== 3) return fechaIso;

  const [anio, mes, dia] = partes;
  const mesIdx = Number(mes) - 1;
  if (mesIdx < 0 || mesIdx > 11) return fechaIso;

  return `${Number(dia)} ${MESES_CORTOS[mesIdx]} ${anio}`;
}