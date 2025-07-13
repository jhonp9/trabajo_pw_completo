import nodemailer from 'nodemailer';

// Configuración del transporter (usa tu servicio de email)
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendVerificationEmail = async (email: string, code: string) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verificación de tu cuenta',
    html: `
      <h1>Verificación de Email</h1>
      <p>Por favor ingresa el siguiente código para verificar tu cuenta:</p>
      <h2>${code}</h2>
      <p>Este código expirará en 24 horas.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};