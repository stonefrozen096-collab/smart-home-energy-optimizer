/**
 * Optional email alerts via EmailJS (https://www.emailjs.com/) - sends
 * straight from the browser, no backend server needed. Free tier: 200
 * emails/month, no card required.
 *
 * If the three VITE_EMAILJS_* env vars aren't set, email alerts are simply
 * disabled - on-screen + spoken alerts still work regardless.
 */

import emailjs from "@emailjs/browser";

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const emailConfigured = Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

// Avoid spamming - only one email per alert id per cooldown window.
const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const lastSentAt = {};

export async function sendAlertEmail({ toEmail, alertId, message }) {
  if (!emailConfigured || !toEmail) return;

  const now = Date.now();
  if (lastSentAt[alertId] && now - lastSentAt[alertId] < COOLDOWN_MS) return;
  lastSentAt[alertId] = now;

  try {
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: toEmail,
        message,
      },
      { publicKey: PUBLIC_KEY }
    );
  } catch (err) {
    console.error("email alert failed", err);
  }
}
