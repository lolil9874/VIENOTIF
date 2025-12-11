import { NotificationPayload } from "./types";
import { formatOfferForNotification, formatOfferForEmail, getOfferLink } from "./vie-api";
import nodemailer from "nodemailer";

interface UserSettings {
  telegram_bot_token?: string | null;
  smtp_host?: string | null;
  smtp_port?: number | null;
  smtp_user?: string | null;
  smtp_pass?: string | null;
  smtp_from?: string | null;
}

export async function sendNotification(
  channel: string,
  target: string,
  payload: NotificationPayload,
  userSettings?: UserSettings | null
): Promise<void> {
  switch (channel) {
    case "telegram":
      await sendTelegramNotification(target, payload, userSettings?.telegram_bot_token);
      break;
    case "discord":
      await sendDiscordNotification(target, payload);
      break;
    case "email":
      await sendEmailNotification(target, payload, userSettings);
      break;
    default:
      throw new Error(`Unknown channel: ${channel}`);
  }
}

async function sendTelegramNotification(
  chatId: string,
  payload: NotificationPayload,
  botToken?: string | null
): Promise<void> {
  const token = botToken || process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    throw new Error("Telegram bot token not configured");
  }

  const message = formatOfferForNotification(payload.offer);

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }
}

async function sendDiscordNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  const { offer, subscriptionLabel } = payload;
  const startDate = new Date(offer.missionStartDate).toLocaleDateString("fr-FR");

  const embed = {
    title: `🆕 ${offer.missionTitle}`,
    description: `Nouvelle offre pour: **${subscriptionLabel}**`,
    color: 0x4f46e5, // Indigo
    fields: [
      { name: "🏢 Entreprise", value: offer.organizationName, inline: true },
      { name: "📍 Lieu", value: `${offer.cityName}, ${offer.countryNameEn}`, inline: true },
      { name: "📅 Début", value: startDate, inline: true },
      { name: "⏱️ Durée", value: `${offer.missionDuration} mois`, inline: true },
      { name: "💶 Indemnité", value: `${offer.indemnite}€/mois`, inline: true },
      { name: "🏠 Télétravail", value: offer.teleworkingAvailable ? "Oui" : "Non", inline: true },
    ],
    url: getOfferLink(offer),
    timestamp: new Date().toISOString(),
    footer: {
      text: "VIENOTIF • Alertes VIE/VIA",
    },
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      embeds: [embed],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord webhook error: ${error}`);
  }
}

async function sendEmailNotification(
  email: string,
  payload: NotificationPayload,
  userSettings?: UserSettings | null
): Promise<void> {
  const smtpHost = userSettings?.smtp_host || process.env.SMTP_HOST;
  const smtpPort = userSettings?.smtp_port || parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = userSettings?.smtp_user || process.env.SMTP_USER;
  const smtpPass = userSettings?.smtp_pass || process.env.SMTP_PASS;
  const fromEmail = userSettings?.smtp_from || process.env.SMTP_FROM || smtpUser;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error("SMTP not configured. Set SMTP credentials in settings or environment variables.");
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const { offer, subscriptionLabel } = payload;

  await transporter.sendMail({
    from: fromEmail,
    to: email,
    subject: `🆕 Nouvelle offre VIE: ${offer.missionTitle}`,
    html: formatOfferForEmail(offer),
  });
}
