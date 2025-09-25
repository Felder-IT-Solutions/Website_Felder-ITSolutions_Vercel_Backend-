const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
	// CORS - adjust origin as needed for security
	const origin = req.headers.origin || '*';
	res.setHeader('Access-Control-Allow-Origin', origin);
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Credentials', 'true');

	if (req.method === 'OPTIONS') {
		return res.status(204).end();
	}

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST, OPTIONS');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		const { name, company, email, message, service } = req.body || {};

		const smtpUser = process.env.SMTP_USER;
		const smtpPass = process.env.SMTP_PASS;
		const contactTo = process.env.CONTACT_TO || 'business@felder-itsolutions.at';
		const fromEmail = process.env.FROM_EMAIL || smtpUser || 'no-reply@felder-itsolutions.at';

		if (!smtpUser || !smtpPass) {
			return res.status(500).json({ error: 'SMTP credentials not configured' });
		}

		// service should already be the final value (if frontend sent customService it was merged)
		const serviceLabel = (service || 'Allgemeine Anfrage').toString();
		const serviceHeading = serviceLabel.toUpperCase();

		const transporter = nodemailer.createTransport({
			host: 'smtp.world4you.com',
			port: 587,
			secure: false, // STARTTLS
			requireTLS: true,
			auth: { user: smtpUser, pass: smtpPass },
		});

		const subject = serviceLabel; // E-Mail Betreff = ausgewählte Dienstleistung
		const text = [
			`Dienstleistung: ${serviceLabel}`,
			`Name: ${name || '-'}`,
			`Firma: ${company || '-'}`,
			`E-Mail: ${email || '-'}`,
			'',
			'Mitteilung:',
			message || '',
		].join('\n');

		const html = `
  <small>Neue Kontaktanfrage</small>
  <h1 style="text-transform:uppercase">${serviceHeading}</h1>
  <p><strong>Name:</strong> ${name || '-'}</p>
  <p><strong>Firma:</strong> ${company || '-'}</p>
  <p><strong>E-Mail:</strong> ${email || '-'}</p>
  <hr />
  <p>${(message || '').replace(/\n/g, '<br/>')}</p>
`;

		const mailOptions = {
			from: `${serviceLabel} <${fromEmail}>`,
			to: contactTo,
			subject,
			text,
			html,
			replyTo: email || undefined,
			envelope: { from: fromEmail, to: contactTo },
		};

		await transporter.sendMail(mailOptions);

		return res.status(200).json({ success: true });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
	}
};