# ReviewTack → ClickSend Webhook (Vercel)

This is a plug‑and‑play webhook you can deploy to **Vercel**. Point your Bland.ai **SendFollowup Webhook** node at the deployed URL and it will send **SMS + Email via ClickSend**.

## 1) What it does
- Accepts POST JSON from Bland (email, phone, contact_name, business_name, signup_url)
- Sends SMS via ClickSend `/v3/sms/send`
- Sends Email via ClickSend `/v3/email/send` (requires a verified From Email in ClickSend; uses its numeric ID)

## 2) Deploy to Vercel (free)
1. Create a new Vercel project and import this folder.
2. Add these **Environment Variables**:
   - `CLICK_SEND_USERNAME` = your ClickSend username (usually your email)
   - `CLICK_SEND_API_KEY` = your ClickSend API key
   - `CLICK_SEND_SMS_FROM` = (optional) the SMS sender (alphanumeric or number, if allowed)
   - `CLICK_SEND_FROM_EMAIL_ID` = the numeric ID of your verified From Email in ClickSend
3. Deploy. Your endpoint will look like: `https://YOUR-PROJECT.vercel.app/api/send-followup`

## 3) Point Bland.ai to it
In your Bland pathway Webhook node, set:
- **URL** = your Vercel endpoint (above)
- **Method** = POST
- **Headers** = `Content-Type: application/json`
- **Body** = 
```json
{
  "email": "{{captured_email||handler_email}}",
  "phone": "{{captured_mobile||handler_mobile}}",
  "contact_name": "{{handler_name||first_name}}",
  "business_name": "{{business_name}}",
  "signup_url": "{{signup_url}}",
  "utm_source": "bland_outbound",
  "agent": "Vanessa"
}
```

## 4) ClickSend Email "From" setup
- In ClickSend, go to **Email → Email Settings → From Addresses**.
- Add and verify your From Email address.
- Find its **Email Address ID** (a number) and put it into `CLICK_SEND_FROM_EMAIL_ID` env var.
- If you prefer, you can skip email here and use Zapier/Gmail instead—just remove the email fields from the body.

## 5) Test locally (optional)
- Install Vercel CLI: `npm i -g vercel`
- Run: `vercel dev`
- Send a test POST:
```bash
curl -X POST http://localhost:3000/api/send-followup   -H "Content-Type: application/json"   -d '{
    "email":"test@example.com",
    "phone":"+16155551234",
    "contact_name":"Test",
    "business_name":"Sample Co",
    "signup_url":"https://reviewtack.com/signup?src=test"
  }'
```

## 6) Notes
- If you don’t set `CLICK_SEND_FROM_EMAIL_ID`, the function still sends SMS and returns a warning for email.
- Logs will show any ClickSend errors to help you debug (via Vercel logs).

— Enjoy!
