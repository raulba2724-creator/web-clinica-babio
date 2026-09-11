// Dates without an offset are interpreted in Europe/Madrid, never in the runner's timezone.
export function publicationTime(value) {
  if (!value) return null;
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})?$/);
  if (!match) throw new Error(`Fecha de publicación inválida: ${value}. Usa AAAA-MM-DDTHH:mm (hora de Madrid).`);
  const local = `${match[1]}T${match[2]}:${match[3] || '00'}`;
  const wall = Date.parse(`${local}Z`);
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0,19) !== local) throw new Error(`Fecha inexistente: ${value}`);
  if (match[4]) {
    const instant = Date.parse(`${local}${match[4]}`);
    if (!Number.isFinite(instant)) throw new Error(`Zona horaria inválida: ${value}`);
    return instant;
  }
  const formatter = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hourCycle:'h23' });
  const candidates = [60,120].map(offset => wall-offset*60000).filter(t => formatter.format(new Date(t)).replace(' ','T') === local);
  if (candidates.length !== 1) throw new Error(`Hora inexistente o ambigua por cambio de horario: ${value}. Indica un desplazamiento explícito (+01:00 o +02:00).`);
  return candidates[0];
}

export function isVisible(post, now = Date.now()) {
  const scheduled = publicationTime(post.publish_at);
  return post.published === true && (scheduled === null || scheduled <= now);
}

export function effectiveDate(post) {
  const t = publicationTime(post.publish_at);
  return t === null ? post.date : new Intl.DateTimeFormat('sv-SE', { timeZone:'Europe/Madrid', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date(t));
}

export function dueSchedules(posts, recorded = {}, now = Date.now()) {
  return Object.fromEntries(posts.filter(p => p.publish_at && isVisible(p, now) && recorded[p.slug] !== p.publish_at).map(p => [p.slug, p.publish_at]));
}
