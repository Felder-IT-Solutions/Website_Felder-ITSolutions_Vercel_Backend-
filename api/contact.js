// api/contact.js
const nodemailer = require("nodemailer");

const sendError = (res, status, message) =>
	res.status(status).json({ error: message });

function validateEmail(email) {
	return typeof email === "string" && /.+@.+\..+/.test(email);
}

module.exports = async function handler(req, res) {
	// CORS
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");

	if (req.method === "OPTIONS") {
		return res.status(204).end();
	}

	if (req.method !== "POST") {
		return sendError(res, 405, "Method Not Allowed");
	}

	let body = req.body;
	// Some serverless platforms may provide raw string body
	if (!body || Object.keys(body).length === 0) {
		try {
			body = JSON.parse(req.rawBody || req.body || "{}");
		} catch (err) {
			// ignore, will validate below
		}
	}

	const name = (body && body.name) ? String(body.name).trim() : "";
	const company = body && body.company ? String(body.company).trim() : "";
	const email = body && body.email ? String(body.email).trim() : "";
	const service = body && body.service ? String(body.service).trim() : "";
	const message = body && body.message ? String(body.message).trim() : "";

	if (!name) return sendError(res, 400, "Name is required");
	if (!validateEmail(email)) return sendError(res, 400, "Valid email is required");
	if (!service) return sendError(res, 400, "Service is required");
	if (!message) return sendError(res, 400, "Message is required");

	const smtpHost = process.env.SMTP_HOST;
	const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
	const smtpUser = process.env.SMTP_USER;
	const smtpPass = process.env.SMTP_PASS;
	const contactTo = process.env.CONTACT_TO || "business@felder-itsolutions.at";
	const fromEmail = process.env.FROM_EMAIL || smtpUser || "no-reply@felder-itsolutions.at";

	if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
		console.error("SMTP configuration missing");
		return sendError(res, 500, "SMTP configuration not provided on server.");
	}

	try {
		const transporter = nodemailer.createTransport({
			host: smtpHost,
			port: smtpPort,
			secure: smtpPort === 465,
			auth: {
				user: smtpUser,
				pass: smtpPass,
			},
		});

		const subject = `Neue Kontaktanfrage: ${service}`;
		const text = `Dienstleistung: ${service}\nName: ${name}\nUnternehmen: ${company || "-"}\nE-Mail: ${email}\n\nNachricht:\n${message}`;

		const html = `<p><strong>Dienstleistung:</strong> ${escapeHtml(service)}</p>
                 <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                 <p><strong>Unternehmen:</strong> ${escapeHtml(company || "-")}</p>
                 <p><strong>E-Mail:</strong> ${escapeHtml(email)}</p>
                 <h3>Nachricht</h3>
                 <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>`;

		await transporter.sendMail({
			from: fromEmail,
			to: contactTo,
			subject,
			text,
			html,
		});

		return res.status(200).json({ success: true });
	} catch (err) {
		console.error("Failed to send contact email:", err);
		return sendError(res, 500, "Failed to send email.");
	}
};

function escapeHtml(str) {
	if (typeof str !== "string") return "";
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}