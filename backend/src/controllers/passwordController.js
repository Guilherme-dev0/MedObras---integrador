import prisma from "../db/prisma.js";
import bcrypt from "bcryptjs";
import { gerarTokenRecuperacao, hashToken } from "../utils/token.js";

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      errorCode: "EMAIL_OBRIGATORIO",
      title: "E-mail obrigatório",
      message: "Informe o e-mail para continuar.",
    });
  }

  // Validação real de e-mail (Fim do Modo Acadêmico)
  const empresa = await prisma.empresa.findUnique({ where: { email } });
  
  if (!empresa) {
    return res.status(400).json({
      success: false,
      errorCode: "EMAIL_NAO_ENCONTRADO",
      title: "E-mail não cadastrado",
      message: "E-mail não cadastrado",
    });
  }

  // invalida tokens anteriores ainda válidos
  await prisma.passwordResetToken.updateMany({
    where: { empresaId: empresa.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const { token, tokenHash } = gerarTokenRecuperacao();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.passwordResetToken.create({
    data: { tokenHash, expiresAt, empresaId: empresa.id },
  });

  // DEV: printa o link no console e retorna ao cliente (simulação de envio de e-mail)
  const frontUrl = process.env.FRONT_URL || "http://localhost:5173";
  const resetLink = `${frontUrl}/resetar-senha?token=${token}`;

  // Retorno de sucesso real
  return res.status(200).json({
    success: true,
    message: "Link de recuperação gerado com sucesso.",
    resetLink // Retornando para o frontend simular o envio, conforme fluxo atual
  });
};

export const forgotLicense = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      errorCode: "EMAIL_OBRIGATORIO",
      title: "E-mail obrigatório",
      message: "Informe o e-mail para continuar.",
    });
  }

  const empresa = await prisma.empresa.findUnique({ where: { email } });
  
  if (!empresa) {
    return res.status(400).json({
      success: false,
      errorCode: "EMAIL_NAO_ENCONTRADO",
      title: "E-mail não cadastrado",
      message: "E-mail não cadastrado",
    });
  }

  await prisma.passwordResetToken.updateMany({
    where: { empresaId: empresa.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });

  const { token, tokenHash } = gerarTokenRecuperacao();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { tokenHash, expiresAt, empresaId: empresa.id },
  });

  const frontUrl = process.env.FRONT_URL || "http://localhost:5173";
  const resetLink = `${frontUrl}/redefinir-licenca?token=${token}`;
  
  return res.status(200).json({ 
    success: true, 
    message: "Link de recuperação gerado com sucesso.", 
    resetLink 
  });
};

export const resetPassword = async (req, res) => {
  const { token, novaSenha } = req.body;

  if (!token || !novaSenha) {
    return res.status(400).json({
      success: false,
      errorCode: "DADOS_OBRIGATORIOS",
      title: "Dados obrigatórios",
      message: "Informe o token e a nova senha para continuar.",
    });
  }

  if (String(novaSenha).length < 6) {
    return res.status(400).json({
      success: false,
      errorCode: "SENHA_FRACA",
      title: "Senha muito curta",
      message: "Use uma senha com pelo menos 6 caracteres.",
    });
  }

  const tokenHash = hashToken(token);

  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!registro || registro.usedAt) {
    return res.status(400).json({
      success: false,
      errorCode: "TOKEN_INVALIDO",
      title: "Link inválido",
      message: "Este link é inválido ou já foi utilizado. Solicite uma nova recuperação.",
    });
  }

  if (registro.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      errorCode: "TOKEN_EXPIRADO",
      title: "Link expirado",
      message: "Este link expirou. Solicite uma nova recuperação.",
    });
  }

  const senhaHash = await bcrypt.hash(novaSenha, 8);

  await prisma.empresa.update({
    where: { id: registro.empresaId },
    data: { senha: senhaHash },
  });

  await prisma.passwordResetToken.update({
    where: { id: registro.id },
    data: { usedAt: new Date() },
  });

  return res.status(200).json({
    success: true,
    title: "Senha atualizada",
    message: "Sua senha foi redefinida com sucesso. Agora você já pode fazer login.",
  });
};

export const resetLicense = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      errorCode: "DADOS_OBRIGATORIOS",
      title: "Dados obrigatórios",
      message: "Informe o token para continuar.",
    });
  }

  const tokenHash = hashToken(token);

  const registro = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!registro || registro.usedAt) {
    return res.status(400).json({
      success: false,
      errorCode: "TOKEN_INVALIDO",
      title: "Link inválido",
      message: "Este link é inválido ou já foi utilizado. Solicite uma nova recuperação.",
    });
  }

  if (registro.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      errorCode: "TOKEN_EXPIRADO",
      title: "Link expirado",
      message: "Este link expirou. Solicite uma nova recuperação.",
    });
  }

  // Busca única das licenças existentes e compara em memória
  const licencas = await prisma.empresa.findMany({
    select: { licenca: true },
  });
  const usadas = new Set(
    (licencas || []).map((l) => String(l.licenca || "").trim())
  );

  function gerarLicenca() {
    return String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  }

  let novaLicenca = gerarLicenca();
  let tentativas = 0;
  while (usadas.has(novaLicenca) && tentativas < 50) {
    novaLicenca = gerarLicenca();
    tentativas++;
  }

  await prisma.empresa.update({
    where: { id: registro.empresaId },
    data: { licenca: novaLicenca },
  });

  await prisma.passwordResetToken.update({
    where: { id: registro.id },
    data: { usedAt: new Date() },
  });

  return res.status(200).json({
    success: true,
    novaLicenca,
  });
};
