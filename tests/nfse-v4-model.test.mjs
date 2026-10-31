import test from 'node:test';
import assert from 'node:assert/strict';

const m = await import('../docs/public/grupo-csv/nfse/model.js').catch(() => ({}));

test('valor em reais preserva centavos sem cálculo com ponto flutuante', () => {
  assert.equal(m.parseMoney?.('8.055,01'), 805501);
  assert.equal(m.parseMoney?.('10000,00'), 1000000);
  assert.equal(m.parseMoney?.('0,01'), 1);
});

test('valor monetário ambíguo ou negativo é recusado', () => {
  for (const value of ['8,055.00', '-10,00', '1,234', '1e3', '1.2.3,45', '']) {
    assert.throws(() => m.parseMoney?.(value), /valor/i);
  }
});

test('calendário aplica último dia e competência anterior sem fuso implícito', () => {
  const rule = { day_of_month:31, start_date:'2026-01-01', end_date:null, status:'active', missing_day_policy:'last_day', competence_rule:'previous_month' };
  assert.deepEqual(m.occurrence?.(rule, '2026-02'), { date:'2026-02-28', competence:'2026-01', needsDate:false });
  assert.deepEqual(m.occurrence?.(rule, '2028-02'), { date:'2028-02-29', competence:'2028-01', needsDate:false });
  assert.equal(m.occurrence?.(rule, '2027-01')?.competence, '2026-12');
});

test('regra manual não inventa data nem reaproveita regra fora da vigência', () => {
  const rule = { day_of_month:31, start_date:'2026-01-01', end_date:null, status:'active', missing_day_policy:'manual', competence_rule:'same_month' };
  assert.deepEqual(m.occurrence?.(rule, '2026-02'), { date:null, competence:'2026-02', needsDate:true });
  assert.equal(m.occurrence?.({...rule, status:'paused'}, '2026-02'), null);
  assert.equal(m.occurrence?.({...rule, start_date:'2026-03-01'}, '2026-02'), null);
  assert.equal(m.occurrence?.({...rule, end_date:'2026-01-31'}, '2026-02'), null);
});

test('dia previsto anterior ao início ou após fim de vigência não aparece', () => {
  const rule = { day_of_month:10, start_date:'2026-02-15', end_date:null, status:'active', missing_day_policy:'last_day', competence_rule:'same_month' };
  assert.equal(m.occurrence?.(rule, '2026-02'), null);
  assert.equal(m.occurrence?.({...rule, start_date:'2026-01-01', end_date:'2026-02-09'}, '2026-02'), null);
});
