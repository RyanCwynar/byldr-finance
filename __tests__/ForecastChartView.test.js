import assert from 'node:assert';
import test from 'node:test';

function filterMetrics(metrics, timeframe) {
  if (timeframe === 'all') return metrics;
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return metrics.filter(m => m.date >= cutoff);
}

test('filters metrics within timeframe', () => {
  const now = Date.now();
  const metrics = [
    {date: now - 10 * 24 * 60 * 60 * 1000},
    {date: now - 5 * 24 * 60 * 60 * 1000},
  ];
  const result = filterMetrics(metrics, '7d');
  assert.strictEqual(result.length, 1);
});
