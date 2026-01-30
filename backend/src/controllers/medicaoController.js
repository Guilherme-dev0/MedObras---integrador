import prisma from "../db/prisma.js";

/* ============================================================
   LISTAR TODAS AS MEDIÇÕES
   ============================================================ */
export async function listarMedicoes(req, res) {
  try {
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    const medicoes = await prisma.medicao.findMany({
      where: { empresaId },
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
      orderBy: { id: "desc" },
    });

    return res.json(medicoes);
  } catch (err) {
    console.error("Erro ao listar medições:", err);
    return res.status(500).json({ erro: "Erro ao listar medições" });
  }
}

/* ============================================================
   LISTAR APENAS MEDIÇÕES PENDENTES
   ============================================================ */
export async function listarPendentes(req, res) {
  try {
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    const medicoes = await prisma.medicao.findMany({
      where: {
        empresaId,
        status: "pendente",
      },
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
      orderBy: { id: "desc" },
    });

    return res.json(medicoes);
  } catch (err) {
    console.error("Erro ao listar medições pendentes:", err);
    return res.status(500).json({ erro: "Erro ao listar medições pendentes" });
  }
}

/* ============================================================
   LISTAR APENAS MEDIÇÕES CONCLUÍDAS (com filtros)
   ============================================================ */
export async function listarConcluidas(req, res) {
  try {
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({
        success: false,
        title: "Acesso negado",
        message: "Faça login novamente.",
      });
    }

    // filtros opcionais via query
    const q = (req.query.q || "").toString().trim();
    const de = req.query.de
      ? (() => {
          const [y, m, d] = String(req.query.de).split("-");
          return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
        })()
      : null;
    const ate = req.query.ate
      ? (() => {
          const [y, m, d] = String(req.query.ate).split("-");
          return new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 59, 999);
        })()
      : null;

    // status aceitos (para não quebrar se existirem dados antigos)
    const statusConcluida = ["concluída", "concluida", "concluido"];

    const where = {
      empresaId,
      status: { in: statusConcluida },
      ...(q
        ? {
            OR: [
              { cliente: { nome: { contains: q } } },
              { endereco: { logradouro: { contains: q } } },
              { endereco: { bairro: { contains: q } } },
              { endereco: { cidade: { contains: q } } },
              { produto: { nome: { contains: q } } },
            ],
          }
        : {}),
      ...(de || ate
        ? {
            dataAgendada: {
              ...(de ? { gte: de } : {}),
              ...(ate ? { lte: ate } : {}),
            },
          }
        : {}),
    };

    const medicoes = await prisma.medicao.findMany({
      where,
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
      orderBy: { id: "desc" },
    });

    return res.json(medicoes);
  } catch (err) {
    console.error("Erro ao listar medições concluídas:", err);
    return res.status(500).json({
      success: false,
      title: "Falha ao carregar",
      message: "Não foi possível carregar as medições concluídas. Tente novamente.",
    });
  }
}

/* ============================================================
   CRIAR MEDIÇÃO
   ============================================================ */
export async function criarMedicao(req, res) {
  try {
    const { clienteId, enderecoId, produtoId, dataAgendada, descricao } = req.body;

    if (!clienteId || !enderecoId || !dataAgendada) {
      return res.status(400).json({
        erro: "Cliente, endereço e data/hora são obrigatórios.",
      });
    }

    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    //  garante que o endereço pertence ao cliente e à empresa logada
    const enderecoValido = await prisma.endereco.findFirst({
      where: {
        id: Number(enderecoId),
        clienteId: Number(clienteId),
        cliente: { empresaId },
      },
    });

    if (!enderecoValido) {
      return res.status(400).json({ erro: "Endereço inválido para este cliente." });
    }

    const medicao = await prisma.medicao.create({
      data: {
        cliente: { connect: { id: Number(clienteId) } },
        endereco: { connect: { id: Number(enderecoId) } },
        empresa: { connect: { id: empresaId } },

        // produto é opcional
        ...(produtoId ? { produto: { connect: { id: Number(produtoId) } } } : {}),

        dataAgendada: new Date(dataAgendada),
        descricao: descricao || null,
        status: "pendente",
      },
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
    });

    return res.status(201).json(medicao);
  } catch (err) {
    console.error("Erro ao cadastrar medição:", err);
    return res.status(500).json({ erro: "Erro ao criar medição" });
  }
}
//BUSCAR 1 MEDIÇÃO POR ID (para tela de edição)
   
  
export async function buscarMedicaoPorId(req, res) {
  try {
    const { id } = req.params;
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    const medicao = await prisma.medicao.findFirst({
      where: {
        id: Number(id),
        empresaId, // ✅ garante que é da empresa logada
      },
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
    });

    if (!medicao) {
      return res.status(404).json({ erro: "Medição não encontrada." });
    }

    return res.json(medicao);
  } catch (err) {
    console.error("Erro ao buscar medição:", err);
    return res.status(500).json({ erro: "Erro ao buscar medição" });
  }
}

 
//ATUALIZAR MEDIÇÃO (edição completa)
   
export async function atualizarMedicao(req, res) {
  try {
    const { id } = req.params;
    const empresaId = req.user?.id;

    const {
      clienteId,
      enderecoId,
      produtoId, // opcional
      dataAgendada,
      descricao, // opcional
      largura, // opcional
      altura, // opcional
      observacao, // opcional (se você usar)
      status, // opcional
    } = req.body;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    //  checa se existe e é da empresa
    const existe = await prisma.medicao.findFirst({
      where: { id: Number(id), empresaId },
    });

    if (!existe) {
      return res.status(404).json({ erro: "Medição não encontrada." });
    }

    // ✅ se mandar clienteId/enderecoId, valida vínculo endereço->cliente->empresa
    if (clienteId && enderecoId) {
      const enderecoValido = await prisma.endereco.findFirst({
        where: {
          id: Number(enderecoId),
          clienteId: Number(clienteId),
          cliente: { empresaId },
        },
      });

      if (!enderecoValido) {
        return res.status(400).json({ erro: "Endereço inválido para este cliente." });
      }
    }

    const medicaoAtualizada = await prisma.medicao.update({
      where: { id: Number(id) },
      data: {
        ...(clienteId ? { clienteId: Number(clienteId) } : {}),
        ...(enderecoId ? { enderecoId: Number(enderecoId) } : {}),

  
        ...(produtoId === "" || produtoId === null
          ? { produtoId: null }
          : produtoId
          ? { produtoId: Number(produtoId) }
          : {}),

        ...(dataAgendada ? { dataAgendada: new Date(dataAgendada) } : {}),
        ...(descricao !== undefined ? { descricao: descricao || null } : {}),
        ...(observacao !== undefined ? { observacao: observacao || null } : {}),

        ...(largura !== undefined ? { largura: largura ? Number(largura) : null } : {}),
        ...(altura !== undefined ? { altura: altura ? Number(altura) : null } : {}),

        ...(status ? { status } : {}),
      },
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
    });

    return res.json(medicaoAtualizada);
  } catch (err) {
    console.error("Erro ao atualizar medição:", err);
    return res.status(500).json({ erro: "Erro ao atualizar medição" });
  }
}


//ATUALIZAR STATUS (seguro por empresa)
   
export async function atualizarStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    if (!status) {
      return res.status(400).json({ erro: "Informe o status" });
    }

    const existe = await prisma.medicao.findFirst({
      where: { id: Number(id), empresaId },
    });

    if (!existe) {
      return res.status(404).json({ erro: "Medição não encontrada." });
    }

    const medicao = await prisma.medicao.update({
      where: { id: Number(id) },
      data: { status },
    });

    return res.json(medicao);
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
    return res.status(400).json({ erro: "Erro ao atualizar status" });
  }
}


   //CONCLUIR MEDIÇÃO (seguro por empresa)
   
export async function concluirMedicao(req, res) {
  try {
    const { id } = req.params;
    const { largura, altura, observacao } = req.body;
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    const existe = await prisma.medicao.findFirst({
      where: { id: Number(id), empresaId },
    });

    if (!existe) {
      return res.status(404).json({ erro: "Medição não encontrada." });
    }

    const medicao = await prisma.medicao.update({
      where: { id: Number(id) },
      data: {
        largura: largura ? Number(largura) : null,
        altura: altura ? Number(altura) : null,
        observacao: observacao || null,
        status: "concluída",
      },
    });

    return res.json(medicao);
  } catch (err) {
    console.error("Erro ao concluir medição:", err);
    return res.status(400).json({ erro: "Erro ao concluir medição" });
  }
}


  // EXCLUIR MEDIÇÃO (seguro por empresa)//
   
export async function excluirMedicao(req, res) {
  try {
    const { id } = req.params;
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    const existe = await prisma.medicao.findFirst({
      where: { id: Number(id), empresaId },
    });

    if (!existe) {
      return res.status(404).json({ erro: "Medição não encontrada." });
    }

    await prisma.medicao.delete({
      where: { id: Number(id) },
    });

    return res.json({ mensagem: "Medição excluída com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir medição:", err);
    return res.status(400).json({ erro: "Erro ao excluir medição" });
  }
}
