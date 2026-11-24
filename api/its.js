// 제주 안전알림 - 도로 통제(ITS) 중계 서버
const TARGETS = [
  'https://openapi.its.go.kr:9443/eventInfo',
  'https://openapi.its.go.kr/eventInfo',
];

module.exports = async (req, res) => {
  const q = new URL(req.url, 'http://x').searchParams;
  if (!process.env.RELAY_TOKEN || q.get('t') !== process.env.RELAY_TOKEN) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  q.delete('t');
  if (process.env.ITS_KEY) q.set('apiKey', process.env.ITS_KEY);

  let lastErr = '';
  for (const base of TARGETS) {
    try {
      const r = await fetch(base + '?' + q.toString(), { signal: AbortSignal.timeout(15000) });
      const text = await r.text();
      if (r.ok) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        res.status(200).send(text);
        return;
      }
      lastErr = 'HTTP ' + r.status + ' ' + text.slice(0, 120);
    } catch (e) {
      lastErr = String((e && e.cause && e.cause.code) || (e && e.message) || e);
    }
  }
res.status(502).json({ error: lastErr, region: process.env.VERCEL_REGION || '?' });
};
