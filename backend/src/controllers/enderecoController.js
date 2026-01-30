import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()


//  CRIAR ENDEREÇO

export const criarEndereco = async (req, res) => {
  const { clienteId, logradouro, bairro, cidade, cep } = req.body

  try {
    const endereco = await prisma.endereco.create({
      data: {
        clienteId: Number(clienteId),
        logradouro,
        bairro,
        cidade,
        cep
      }
    })

    return res.status(201).json(endereco)

  } catch (err) {
    console.error("Erro ao criar endereço:", err)
    return res.status(400).json({ erro: "Erro ao criar endereço" })
  }
}




//  LISTAR TODOS OS ENDEREÇOS DA EMPRESA LOGADA

export const listarEnderecos = async (req, res) => {
  try {
    const empresaId = req.user.id // vem do token

    const enderecos = await prisma.endereco.findMany({
      where: {
        cliente: {
          empresaId: empresaId
        }
      },
      include: {
        cliente: true
      }
    })

    return res.json(enderecos)

  } catch (err) {
    console.error("Erro ao listar endereços:", err)
    return res.status(500).json({ erro: "Erro ao listar endereços" })
  }
}



// BUSCAR ENDEREÇOS POR NOME, BAIRRO, CIDADE OU LOGRADOURO

export const buscarEndereco = async (req, res) => {
  const termo = req.query.q || ""

  try {
    const empresaId = req.user.id

    const resultados = await prisma.endereco.findMany({
      where: {
        cliente: { empresaId },
        OR: [
          { logradouro: { contains: termo } },
          { bairro: { contains: termo } },
          { cidade: { contains: termo } },
          { cliente: { nome: { contains: termo } } }
        ]
      },
      include: { cliente: true }
    })

    return res.json(resultados)

  } catch (err) {
    console.error("Erro ao buscar endereços:", err)
    return res.status(500).json({ erro: "Erro interno ao buscar" })
  }
}

// LISTAR ENDEREÇOS DE UM CLIENTE ESPECÍFICO
export const listarEnderecosPorCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const empresaId = req.user.id; 

    const enderecos = await prisma.endereco.findMany({
      where: {
        clienteId: Number(id),
        cliente: { empresaId } // ✅ garante que é da empresa logada
      },
      orderBy: [{ cidade: "asc" }, { bairro: "asc" }, { logradouro: "asc" }],
      select: {
        id: true,
        logradouro: true,
        bairro: true,
        cidade: true,
        cep: true,
      }
    });

    return res.json(enderecos);

  } catch (err) {
    console.error("Erro ao listar endereços do cliente:", err);
    return res.status(500).json({
      success: false,
      title: "Erro ao carregar endereços",
      message: "Não foi possível carregar os endereços do cliente. Tente novamente."
    });
  }
};


// DELETAR ENDEREÇO
export const deletarEndereco = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.endereco.delete({
      where: { id: Number(id) }
    });

    return res.json({ mensagem: "Endereço deletado com sucesso" });

  } catch (err) {
    console.error("Erro ao deletar endereço:", err);
    return res.status(400).json({ erro: "Não foi possível deletar o endereço" });
  }
};

export const atualizarEndereco = async (req, res) => {
  const { id } = req.params;
  const { logradouro, bairro, cidade, cep } = req.body;

  try {
    const empresaId = req.user.id;

    const existe = await prisma.endereco.findFirst({
      where: {
        id: Number(id),
        cliente: { empresaId }
      }
    });

    if (!existe) {
      return res.status(404).json({ erro: "Endereço não encontrado" });
    }

    const atualizado = await prisma.endereco.update({
      where: { id: Number(id) },
      data: {
        ...(logradouro !== undefined ? { logradouro } : {}),
        ...(bairro !== undefined ? { bairro } : {}),
        ...(cidade !== undefined ? { cidade } : {}),
        ...(cep !== undefined ? { cep } : {}),
      }
    });

    return res.json(atualizado);
  } catch (err) {
    console.error("Erro ao atualizar endereço:", err);
    return res.status(500).json({ erro: "Erro ao atualizar endereço" });
  }
}
