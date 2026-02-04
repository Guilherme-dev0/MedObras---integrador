import prisma from "../db/prisma.js";

function normalizeProdutosSelecionadosFromDescricao(m) {
  let produtosSelecionados = [];
  let obsTexto = m.observacao || m.descricao || null;
  if (typeof m.descricao === "string") {
    try {
      const parsed = JSON.parse(m.descricao);
      if (parsed && Array.isArray(parsed.itens)) {
        produtosSelecionados = parsed.itens.map((it) => ({
          id: Number(it.id),
          nome: String(it.nome || ""),
          quantidade: it.quantidade != null ? Number(it.quantidade) : 1,
          altura: it.altura != null ? Number(it.altura) : null,
          largura: it.largura != null ? Number(it.largura) : null,
        }));
      }
      if (parsed && parsed.obs != null) {
        obsTexto = String(parsed.obs);
      }
    } catch {}
    if (produtosSelecionados.length === 0) {
      const parts = m.descricao.split("|");
      const obsPart = parts.find((p) => p.startsWith("obs="));
      const itemsPart = parts.find((p) => p.startsWith("items="));
      if (obsPart) obsTexto = obsPart.slice(4);
      if (itemsPart) {
        const list = itemsPart.slice(6).split(",").filter(Boolean);
        produtosSelecionados = list.map((pair) => {
          const [idStr, qStr] = pair.split(":");
          return {
            id: Number(idStr),
            nome: "",
            quantidade: qStr != null ? Number(qStr) : 1,
            altura: null,
            largura: null,
          };
        });
      }
    }
  }
  return { ...m, produtosSelecionados, descricao: obsTexto };
}

function buildCompactDescricao(obs, itens) {
  const obsTxt = obs ? `obs=${String(obs)}` : "";
  const itemsTxt = Array.isArray(itens) && itens.length > 0
    ? `items=${itens.map((it) => `${Number(it.id)}:${Number(it.quantidade || 1)}`).join(",")}`
    : "";
  const joined = [obsTxt, itemsTxt].filter(Boolean).join("|");
  if (joined.length <= 191) return joined;
  let acc = obsTxt ? `${obsTxt}|items=` : "items=";
  for (const it of itens) {
    const frag = `${Number(it.id)}:${Number(it.quantidade || 1)},`;
    if ((acc + frag).length > 191) break;
    acc += frag;
  }
  return acc.replace(/,$/, "");
}

/* ============================================================
   LISTAR TODAS AS MEDIÇÕES
   ============================================================ */
export async function listarMedicoes(req, res) {
  try {
    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    const medicoesRaw = await prisma.medicao.findMany({
      where: { empresaId },
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
      orderBy: { id: "desc" },
    });

    const medicoes = (medicoesRaw || []).map(normalizeProdutosSelecionadosFromDescricao);
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

    const medicoesRaw = await prisma.medicao.findMany({
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

    const medicoes = (medicoesRaw || []).map(normalizeProdutosSelecionadosFromDescricao);
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

    const medicoesRaw = await prisma.medicao.findMany({
      where,
      include: {
        cliente: true,
        endereco: true,
        produto: true,
      },
      orderBy: { id: "desc" },
    });

    const medicoes = (medicoesRaw || []).map(normalizeProdutosSelecionadosFromDescricao);
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
    const { clienteId, enderecoId, dataAgendada, descricao, produtosSelecionados } = req.body;

    if (!clienteId || !enderecoId || !dataAgendada) {
      return res.status(400).json({
        erro: "Cliente, endereço e data/hora são obrigatórios.",
      });
    }

    const empresaId = req.user?.id;

    if (!empresaId) {
      return res.status(401).json({ erro: "Acesso não autorizado." });
    }

    // Validação: impedir datas retroativas
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0, 0);
    const quando = new Date(dataAgendada);
    if (isNaN(quando.getTime()) || quando < inicioHoje) {
      return res.status(400).json({
        erro: "Data inválida. Não é possível agendar medições em datas retroativas.",
      });
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

    // compatibilidade com schema atual (apenas um produto opcional na Medição)
    const produtoIdPrimario = Array.isArray(produtosSelecionados) && produtosSelecionados.length > 0
      ? Number(produtosSelecionados[0]?.id)
      : null;

    const medicao = await prisma.medicao.create({
      data: {
        cliente: { connect: { id: Number(clienteId) } },
        endereco: { connect: { id: Number(enderecoId) } },
        empresa: { connect: { id: empresaId } },
        ...(produtoIdPrimario ? { produto: { connect: { id: produtoIdPrimario } } } : {}),

        dataAgendada: new Date(dataAgendada),
        descricao: Array.isArray(produtosSelecionados)
          ? JSON.stringify({
              obs: descricao || null,
              itens: produtosSelecionados.map((it) => ({
                id: Number(it.id),
                nome: String(it.nome || ""),
                quantidade: it.quantidade != null ? Number(it.quantidade) : 1,
                altura: it.altura != null ? Number(it.altura) : null,
                largura: it.largura != null ? Number(it.largura) : null,
              })),
            })
          : (descricao || null),
        status: "pendente",
      },
      include: {
        cliente: true,
        endereco: true,
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
      // removido include de itens por incompatibilidade com o schema atual
      },
    });

    if (!medicao) {
      return res.status(404).json({ erro: "Medição não encontrada." });
    }

    const resposta = normalizeProdutosSelecionadosFromDescricao(medicao);
    return res.json(resposta);
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
      dataAgendada,
      descricao, // opcional
      largura, // opcional
      altura, // opcional
      observacao, // opcional (se você usar)
      status, // opcional
      itens, // opcional: substitui lista de itens
      produtosSelecionados, // opcional: compatibilidade com UI atual (escolhe 1º como principal)
    } = req.body;

    console.log("Atualizar Medição payload:", {
      id,
      clienteId,
      enderecoId,
      dataAgendada,
      descricao,
      observacao,
      status,
      itensCount: Array.isArray(itens) ? itens.length : 0,
      produtosSelecionadosCount: Array.isArray(produtosSelecionados) ? produtosSelecionados.length : 0,
    });

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

    // substituição de itens (se enviados)
    if (Array.isArray(itens)) {
      await prisma.itemMedicao.deleteMany({ where: { medicaoId: Number(id) } });
      if (itens.length > 0) {
        await prisma.itemMedicao.createMany({
          data: itens.map((it) => ({
            medicaoId: Number(id),
            produtoId: Number(it.produtoId),
            quantidade: it.quantidade ? Number(it.quantidade) : 1,
          })),
        });
      }
    }

    // produto primário via produtosSelecionados (compatibilidade com schema atual)
    const produtoIdPrimario =
      Array.isArray(produtosSelecionados) && produtosSelecionados.length > 0
        ? Number(produtosSelecionados[0]?.id)
        : null;

    const dataUpdate = {
      ...(clienteId ? { cliente: { connect: { id: Number(clienteId) } } } : {}),
      ...(enderecoId ? { endereco: { connect: { id: Number(enderecoId) } } } : {}),
      ...(dataAgendada ? { dataAgendada: new Date(dataAgendada) } : {}),
      ...(Array.isArray(produtosSelecionados)
        ? {
            descricao: JSON.stringify({
              obs: (descricao !== undefined ? descricao : (observacao !== undefined ? observacao : null)) || null,
              itens: produtosSelecionados.map((it) => ({
                id: Number(it.id),
                nome: String(it.nome || ""),
                quantidade: it.quantidade != null ? Number(it.quantidade) : 1,
                altura: it.altura != null ? Number(it.altura) : null,
                largura: it.largura != null ? Number(it.largura) : null,
              })),
            }),
          }
        : (descricao !== undefined ? { descricao: descricao || null } : {})),
      ...(observacao !== undefined ? { observacao: observacao || null } : {}),
      ...(largura !== undefined ? { largura: largura ? Number(largura) : null } : {}),
      ...(altura !== undefined ? { altura: altura ? Number(altura) : null } : {}),
      ...(status ? { status } : {}),
      ...(produtoIdPrimario
        ? { produto: { connect: { id: produtoIdPrimario } } }
        : { produto: { disconnect: true } }),
    };
    console.log("Update data keys:", Object.keys(dataUpdate));
    const medicaoAtualizada = await prisma.medicao.update({
      where: { id: Number(id) },
      data: dataUpdate,
      include: {
        cliente: true,
        produto: true,
        endereco: true,
      },
    });
    console.log("Medicao atualizada:", {
      id: medicaoAtualizada.id,
      clienteId: medicaoAtualizada.clienteId,
      enderecoId: medicaoAtualizada.enderecoId,
      produtoId: medicaoAtualizada.produtoId,
      status: medicaoAtualizada.status,
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
    const { largura, altura, observacao, produtosSelecionados } = req.body;
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

    const descricaoPersistida =
      Array.isArray(produtosSelecionados) && produtosSelecionados.length > 0
        ? JSON.stringify({ itens: produtosSelecionados })
        : undefined;

    const medicao = await prisma.medicao.update({
      where: { id: Number(id) },
      data: {
        largura: largura ? Number(largura) : null,
        altura: altura ? Number(altura) : null,
        observacao: observacao || null,
        descricao: JSON.stringify({
          obs: observacao || null,
          itens: Array.isArray(produtosSelecionados)
            ? produtosSelecionados.map((it) => ({
                id: Number(it.id),
                nome: String(it.nome || ""),
                quantidade: it.quantidade != null ? Number(it.quantidade) : 1,
                altura: it.altura != null ? Number(it.altura) : null,
                largura: it.largura != null ? Number(it.largura) : null,
              }))
            : [],
        }),
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
