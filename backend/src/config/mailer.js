import nodemailer from "nodemailer";

function createOptions(port, secure) {
  return {
    host: "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    socketTimeout: 20000,
  };
}

function createPrimaryTransport() {
  return nodemailer.createTransport(createOptions(465, true));
}

export const enviarEmail = async (destinatario, assunto, conteudoHtml) => {
  try {
    const t1 = createPrimaryTransport();
    const info = await t1.sendMail({
      from: `"MedObras" <${process.env.EMAIL_USER}>`,
      to: destinatario,
      subject: assunto,
      html: conteudoHtml,
    });
    console.log(`E-mail enviado para ${destinatario} com sucesso! ID: ${info.messageId}`);
    return info;
  } catch (error) {
    const transient =
      error && (error.code === "ETIMEDOUT" || error.code === "ECONNECTION" || error.code === "ECONNRESET");
    if (!transient) {
      console.error("Erro ao enviar e-mail:", error);
      return null;
    }
    try {
      const t2 = nodemailer.createTransport(createOptions(587, false));
      const info2 = await t2.sendMail({
        from: `"MedObras" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: assunto,
        html: conteudoHtml,
      });
      console.log(`E-mail enviado para ${destinatario} com sucesso! ID: ${info2.messageId}`);
      return info2;
    } catch (e2) {
      console.error("Erro ao enviar e-mail:", e2);
      return null;
    }
  }
};

export default createPrimaryTransport();
