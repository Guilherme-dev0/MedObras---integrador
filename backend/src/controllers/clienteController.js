import prisma from "../db/prisma.js";


//  Criar cliente
export const criarCliente = async (req, res) => {
  const { nome, telefone, cpf } = req.body
  const empresaId = req.user.id

  if (!nome || !telefone || !cpf) {
    return res.status(400).json({ erro: "Nome, telefone e CPF são obrigatórios." })
  }

  // validar CPF apenas com números
  const cpfLimpo = cpf.replace(/\D/g, "")
  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ erro: "CPF inválido. Digite apenas números." })
  }

  try {
    // verificar duplicidade
    const existe = await prisma.cliente.findFirst({
      where: { cpf: cpfLimpo, empresaId }
    })

    if (existe) {
      return res.status(400).json({ erro: "Este CPF já está cadastrado." })
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        telefone,
        cpf: cpfLimpo,
        empresaId
      }
    })

    return res.status(201).json(cliente)

  } catch (err) {
    console.error("Erro ao criar cliente:", err)
    res.status(500).json({ erro: "Erro interno ao criar cliente." })
  }
}



//  Listar clientes apenas da empresa logada
export async function listarClientes(req, res) {
  try {
    const empresaId = req.user.id;

    const clientes = await prisma.cliente.findMany({
      where: { empresaId },
      include: { enderecos: true }
    });

    res.json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao listar clientes" });
  }
}



//  Atualizar cliente
export async function atualizarCliente(req, res) {
  try {
    const { id } = req.params;
    const { nome, telefone, cpf } = req.body;

    if (!nome || !telefone || !cpf) {
      return res.status(400).json({ erro: "Campos obrigatórios faltando." });
    }

    const cpfLimpo = cpf.replace(/\D/g, "");

    
    const existe = await prisma.cliente.findFirst({
      where: {
        cpf: cpfLimpo,
        empresaId: req.user.id, 
        NOT: { id: Number(id) }
      }
    });

    if (existe) {
      return res.status(400).json({ erro: "CPF já cadastrado." });
    }

    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nome, telefone, cpf: cpfLimpo }
    });

    res.json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: "Erro ao atualizar cliente" });
  }
}


// Deletar cliente (com delete em cascata no endereço)
export async function deletarCliente(req, res) {
  try {
    const { id } = req.params;

    await prisma.cliente.delete({
      where: { id: Number(id) }
    });

    res.json({ mensagem: "Cliente deletado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ erro: "Erro ao excluir cliente (verifique vínculos)" });
  }
}

export async function buscarClientePorNome(req, res) {
  try {
    const { nome } = req.params;

    const termo = String(nome || "").trim();
    try {
      const clientes = await prisma.cliente.findMany({
        where: {
          empresaId: req.user.id,
          OR: [
            { nome: { contains: termo } },
            { telefone: { contains: termo } },
            { cpf: { contains: termo } },
          ],
        },
        select: {
          id: true,
          nome: true,
          telefone: true,
          cpf: true,
        },
      });
      return res.json(clientes);
    } catch (dbErr) {
      const todos = await prisma.cliente.findMany({
        where: { empresaId: req.user.id },
        select: { id: true, nome: true, telefone: true, cpf: true },
      });
      const normalizar = (s) =>
        String(s || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const qn = normalizar(termo);
      const filtrados = todos.filter((c) => {
        return (
          normalizar(c.nome).includes(qn) ||
          normalizar(c.telefone).includes(qn) ||
          normalizar(c.cpf).includes(qn)
        );
      });
      return res.json(filtrados);
    }

  } catch (error) {
    console.error("❌ ERRO NO buscarClientePorNome:");
    console.error(error);

    res.status(500).json({ erro: "Erro interno ao buscar clientes." });
  }
}
