export function parseMoney(value) {
  const text = String(value).trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) throw new Error('Informe um valor como 1.234,56.');
  const [whole, decimals = ''] = text.replaceAll('.', '').split(',');
  const cents = BigInt(whole) * 100n + BigInt(decimals.padEnd(2, '0'));
  if (cents <= 0n || cents > 99999999999n) throw new Error('O valor deve ser positivo e respeitar o limite permitido.');
  return Number(cents);
}

export function money(cents) {
  return Number.isSafeInteger(cents) ? new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(cents / 100) : '—';
}

export function occurrence(rule, month) {
  if (rule.status !== 'active' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return null;
  const [y, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const monthEnd = `${month}-${String(last).padStart(2, '0')}`;
  if (rule.start_date > monthEnd || (rule.end_date && rule.end_date < `${month}-01`)) return null;
  const missing = rule.day_of_month > last;
  const date = missing && rule.missing_day_policy === 'manual' ? null : `${month}-${String(Math.min(last, rule.day_of_month)).padStart(2,'0')}`;
  if (date && (date < rule.start_date || (rule.end_date && date > rule.end_date))) return null;
  const previous = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 7);
  return { date, competence: rule.competence_rule === 'previous_month' ? previous : month, needsDate:date === null };
}

export function currentMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Sao_Paulo', year:'numeric', month:'2-digit' }).formatToParts(new Date());
  return `${parts.find(x => x.type === 'year').value}-${parts.find(x => x.type === 'month').value}`;
}

export function dateLabel(value) {
  if (!value) return 'Data a definir';
  const [y,m,d] = value.slice(0,10).split('-');
  return `${d}/${m}/${y}`;
}
