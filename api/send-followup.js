export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const b = req.body || {};
    // Accept multiple input shapes
    const to   = b.to || b.phone || b.number;                     // E.164 like +16155551234
    const body = b.body || b.message || b.text || b.msg;

    if (!to || !body) {
      return res.status(400).json({ error: 'Missing "to/phone" or "body/message"' });
    }

    const username = process.env.CLICKSEND_USERNAME;
    const apiKey   = process.env.CLICKSEND_API_KEY;
    const from     = process.env.CLICKSEND_FROM;

    if (!username || !apiKey || !from) {
      return res.status(500).json({ error: 'Missing ClickSend env vars' });
    }

    const payload = { messages: [{ source: 'sdk', from, to, body }] };
    const auth = Buffer.from(`${username}:${apiKey}`).toString('base64');

    const r = await fetch('https://rest.clicksend.com/v3/sms/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
}
