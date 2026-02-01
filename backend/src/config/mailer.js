import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  pool: true,
  maxMessages: 50,
  maxConnections: 2,
  rateLimit: 5, // Limite de 5 e-mails por segundo para evitar bloqueio
});

export const enviarEmail = async (destinatario, assunto, conteudoHtml) => {
  try {
    const info = await transporter.sendMail({
      from: `"MedObras" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: assunto,
      html: conteudoHtml,
    });

    console.log(`E-mail enviado para ${destinatario} com sucesso! ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    // Não lançamos o erro para não quebrar o fluxo principal da aplicação
    return null;
  }
};

export default transporter;
