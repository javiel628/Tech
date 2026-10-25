const UPSTREAM = 'https://apis.keithsite.lol/ai/copilot';
const MAX_LENGTH = 6000;
const TIMEOUT_MS = 30000;
// Best-effort per-instance rate limiter. Serverless instances are ephemeral; use a shared store
// (e.g. managed Redis) for enforceable global limits on a public production deployment.
const buckets = new Map();
function limited(key) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.start > 60_000) b = { start: now, count: 0 };
  b.count++;
  buckets.set(key, b);
  if (buckets.size > 500) for (const [k,v] of buckets) if (now-v.start > 60_000) buckets.delete(k);
  return b.count > 15;
}
function extractAnswer(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    try { return extractAnswer(JSON.parse(trimmed)); } catch { return trimmed; }
  }
  if (!value || typeof value !== 'object') return '';
  // Accept common text-bearing fields but return an error rather than stringify unknown JSON.
  for (const key of ['answer','response','message','result','text','output','content']) {
    if (typeof value[key] === 'string' && value[key].trim()) return value[key].trim();
  }
  if (value.data !== undefined) return extractAnswer(value.data);
  if (value.choices?.[0]?.message?.content) return String(value.choices[0].message.content).trim();
  return '';
}
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  const forwarded = req.headers['x-forwarded-for'];
  const clientIp = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '') || 'unknown';
  if (limited(clientIp)) return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
  const message = req.body && req.body.message;
  if (typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message must be a non-empty string.' });
  if (message.length > MAX_LENGTH) return res.status(413).json({ error: `Message is too long. Maximum length is ${MAX_LENGTH} characters.` });
  const url = new URL(UPSTREAM);
  url.searchParams.set('q', message.trim());
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(url.toString(), { method: 'GET', headers: { Accept: 'application/json, text/plain;q=0.9, */*;q=0.8' }, signal: controller.signal });
    const contentType = upstream.headers.get('content-type') || '';
    const raw = await upstream.text();
    if (!upstream.ok) {
      console.error('AI upstream returned HTTP', upstream.status);
      return res.status(502).json({ error: 'The AI service could not complete the request. Please try again shortly.' });
    }
    let payload = raw;
    if (contentType.includes('json')) {
      try { payload = JSON.parse(raw); }
      catch { return res.status(502).json({ error: 'The AI service returned invalid JSON.' }); }
    } else {
      // Some services send JSON without a JSON content type.
      try { payload = JSON.parse(raw); } catch { /* keep plain text */ }
    }
    const answer = extractAnswer(payload);
    if (!answer) {
      console.error('AI upstream response had no recognized answer field; content-type:', contentType);
      return res.status(502).json({ error: 'The AI service returned an empty or unrecognized response format.' });
    }
    return res.status(200).json({ answer });
  } catch (error) {
    if (error && error.name === 'AbortError') return res.status(504).json({ error: 'The AI service timed out. Please try again.' });
    console.error('AI upstream request failed:', error && error.name ? error.name : 'unknown error');
    return res.status(502).json({ error: 'Unable to connect to the AI service. Check the connection and try again.' });
  } finally {
    clearTimeout(timer);
  }
};
