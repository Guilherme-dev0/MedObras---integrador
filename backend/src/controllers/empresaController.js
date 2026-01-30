import prisma from '../db/prisma.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { validarCNPJ } from '../utils/validaCnpj.js'

function gerarLicenca() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export const registerEmpresa = async (req, res) => {
  const { nome, cnpj, telefone, email, senha } = req.body;

  if (!nome || !cnpj || !telefone || !email || !senha) {
    return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
  }

  const cnpjLimpo = cnpj.replace(/\D/g, "");
  const telefoneLimpo = telefone.replace(/\D/g, "");

  //  validação REAL do CNPJ (dígitos verificadores)
  if (!validarCNPJ(cnpjLimpo)) {
    return res.status(400).json({ erro: "CNPJ inválido." });
  }

  const licenca = gerarLicenca();
  const senhaHash = await bcrypt.hash(senha, 8);

  try {
    // checagem amigável antes de criar (evita erro feio do Prisma)
    const jaExiste = await prisma.empresa.findUnique({
      where: { cnpj: cnpjLimpo }
    });

    if (jaExiste) {
      return res.status(400).json({ erro: "CNPJ já cadastrado." });
    }

    const empresa = await prisma.empresa.create({
      data: {
        nome,
        cnpj: cnpjLimpo,
        telefone: telefoneLimpo,
        email,
        senha: senhaHash,
        licenca
      }
    });

    return res.status(201).json({
      mensagem: "Empresa cadastrada com sucesso!",
      licenca: empresa.licenca
    });

  } catch (error) {
    console.error("Erro ao cadastrar empresa", error);

    // se cair no unique (email/licenca/cnpj), devolve msg melhor
    if (error.code === "P2002") {
      return res.status(400).json({ erro: "Dados já cadastrados (CNPJ/email/licença)." });
    }

    return res.status(400).json({ erro: error.message });
  }
};

export const loginEmpresa = async (req, res) => {
  const { cnpj, senha, licenca } = req.body;

  if (!cnpj || !senha || !licenca) {
    return res.status(400).json({ erro: "CNPJ, senha e licença são obrigatórios" });
  }

  //  buscar pelo cnpj limpo (porque você salva limpo)
  const cnpjLimpo = cnpj.replace(/\D/g, "");

  const empresa = await prisma.empresa.findUnique({
    where: { cnpj: cnpjLimpo },
  });

  if (!empresa) {
    return res.status(401).json({ erro: "Empresa não encontrada" });
  }

  if (empresa.licenca.trim() !== String(licenca).trim()) {
    return res.status(401).json({ erro: "Licença incorreta" });
  }

  const senhaConfere = await bcrypt.compare(senha, empresa.senha);

  if (!senhaConfere) {
    return res.status(401).json({ erro: "Senha incorreta" });
  }

  const token = jwt.sign(
    { id: empresa.id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  return res.json({ 
    mensagem: "Login realizado com sucesso", 
    token,
    empresa: {
      nome: empresa.nome,
      email: empresa.email
    }
  });
};
