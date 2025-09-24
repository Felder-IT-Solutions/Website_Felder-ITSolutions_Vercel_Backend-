const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
	// Always set CORS headers (allow origin or use specific origin)
	const origin = req.headers.origin || '*';
	res.setHeader('Access-Control-Allow-Origin', origin);
	res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Credentials', 'true');

	// Handle preflight
	if (req.method === 'OPTIONS') {
		return res.status(204).end();
	}

	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST, OPTIONS');
		return res.status(405).json({ error: 'Method Not Allowed' });
	}

	try {
		const { name, company, email, message } = req.body || {};

		const smtpUser = process.env.SMTP_USER;
		const smtpPass = process.env.SMTP_PASS;

		if (!smtpUser || !smtpPass) {
			return res.status(500).json({ error: 'SMTP credentials not configured' });
		}

		const transporter = nodemailer.createTransport({
			host: 'smtp.world4you.com',
			port: 587,
			secure: false,
			requireTLS: true,
			auth: { user: smtpUser, pass: smtpPass },
		});

		const displayName = name ? `${name} (Kontaktformular)` : 'Kontaktformular';
		const mailOptions = {
			from: `${displayName} <${smtpUser}>`,
			to: process.env.CONTACT_TO || 'business@felder-itsolutions.at',
			subject: 'Neue Kontaktanfrage über das Formular',
			replyTo: email || undefined,
			text: [
				`Name: ${name || ''}`,
				`Firma: ${company || ''}`,
				`E-Mail: ${email || ''}`,
				'',
				'Mitteilung:',
				message || '',
			].join('\n'),
			html: `
    <h2>Neue Kontaktanfrage</h2>
    <p><strong>Name:</strong> ${name || ''}</p>
    <p><strong>Firma:</strong> ${company || ''}</p>
    <p><strong>E-Mail:</strong> ${email || ''}</p>
    <hr />
    <p>${(message || '').replace(/\n/g, '<br />')}</p>
  `,
			envelope: { from: smtpUser, to: process.env.CONTACT_TO || 'business@felder-itsolutions.at' },
		};

		await transporter.sendMail(mailOptions);
		return res.status(200).json({ success: true });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
	}
};