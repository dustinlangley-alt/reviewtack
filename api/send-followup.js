// Vercel Serverless Function: /api/send-followup
// Receives POST JSON from Bland.ai and sends SMS + Email via ClickSend.
// Docs: https://developers.clicksend.com/docs/rest/v3/?ruby#introduction

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }
  try {
    const {
      email,
      phone,
      contact_name,
      business_name,
      signup_url,
      utm_source = "bland_outbound",
      agent = "Vanessa"
    } = req.body || {};

    if (!phone && !email) {
      return res.status(400).json({ error: "Missing phone and email" });
    }

    const username = process.env.CLICK_SEND_USERNAME;
    const apiKey = process.env.CLICK_SEND_API_KEY;
    if (!username || !apiKey) {
      return res.status(500).json({ error: "Missing CLICK_SEND_USERNAME or CLICK_SEND_API_KEY env vars" });
    }

    const authHeader = "Basic " + Buffer.from(`${username}:${apiKey}`).toString("base64");

    // Compose messages
    const smsBody = `${contact_name ? contact_name + ", " : ""}it’s Vanessa @ ReviewTack — here’s the 60-sec demo + fast signup: ${signup_url}  (If you have questions, just reply.)`;
    const emailSubject = `ReviewTack demo + fast signup`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height:1.5;">
        <p>Hi ${contact_name || ""},</p>
        <p>Here’s the 60-second demo and fast signup link for <strong>ReviewTack</strong>:</p>
        <p><a href="${signup_url}" target="_blank" rel="noopener">Open demo + signup</a></p>
        <p>Most clients see <strong>3–5 new Google reviews in the first week</strong> using our automated text & email requests.</p>
        <p>Reply if you’d like help getting set up.</p>
        <p>— Vanessa, ReviewTack</p>
      </div>
    `;

    const results = {};

    // 1) Send SMS if phone provided
    if (phone) {
      const smsPayload = {
        messages: [
          {
            source: "api",
            to: phone,
            body: smsBody,
            custom_string: `reviewtack|${utm_source}`,
            from: process.env.CLICK_SEND_SMS_FROM || undefined
          }
        ]
      };
      const smsResp = await fetch("https://rest.clicksend.com/v3/sms/send", {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(smsPayload)
      });
      const smsJson = await smsResp.json();
      results.sms = { status: smsResp.status, body: smsJson };
      if (!smsResp.ok) {
        console.error("ClickSend SMS error:", smsJson);
      }
    }

    // 2) Send Email if email provided
    if (email) {
      // ClickSend email requires a verified "From Email" with an ID in your account
      const fromEmailId = process.env.CLICK_SEND_FROM_EMAIL_ID;
      if (!fromEmailId) {
        results.email = { warning: "Set CLICK_SEND_FROM_EMAIL_ID to enable transactional email via API" };
      } else {
        const emailPayload = {
          to: [{ email, name: contact_name || "" }],
          from: { email_address_id: Number(fromEmailId) },
          subject: emailSubject,
          body: { html: emailHtml, plaintext: `Open demo + signup: ${signup_url}` },
          custom: `reviewtack|${utm_source}`,
          attachments: []
        };
        const emailResp = await fetch("https://rest.clicksend.com/v3/email/send", {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(emailPayload)
        });
        const emailJson = await emailResp.json();
        results.email = { status: emailResp.status, body: emailJson };
        if (!emailResp.ok) {
          console.error("ClickSend Email error:", emailJson);
        }
      }
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
