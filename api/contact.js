const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
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
			secure: false, // STARTTLS on port 587
			requireTLS: true,
			auth: {
				user: smtpUser,
				pass: smtpPass,
			},
		});

		const mailOptions = {
			from: smtpUser,
			to: 'business@felder-itsolutions.at',
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
		};

		await transporter.sendMail(mailOptions);

		return res.status(200).json({ success: true });
	} catch (err) {
		return res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
	}
};


