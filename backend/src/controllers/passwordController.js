import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { gerarTokenRecuperacao, hashToken } from "../utils/token.js";

const prisma = new PrismaClient();

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

  // ✅ Segurança: não revela se o email existe
  const respostaPadrao = {
    success: true,
    title: "Solicitação enviada",
    message: "Se este e-mail estiver cadastrado, enviaremos um link de recuperação.",
  };

  const empresa = await prisma.empresa.findUnique({ where: { email } });
  if (!empresa) return res.status(200).json(respostaPadrao);

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

  // ✅ DEV: printa o link no console (sem e-mail ainda)
  const frontUrl = process.env.FRONT_URL || "http://localhost:5173";
  console.log("LINK RECUPERACAO (DEV):", `${frontUrl}/resetar-senha?token=${token}`);

  return res.status(200).json(respostaPadrao);
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