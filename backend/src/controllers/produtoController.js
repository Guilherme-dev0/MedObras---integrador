import prisma from "../db/prisma.js";

/* ============================
   LISTAR PRODUTOS (da empresa)
   ============================ */
export const listarProdutos = async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: { empresaId: req.user.id },
      orderBy: { nome: "asc" },
    });

    res.json(produtos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar produtos" });
  }
};

/* ============================
   BUSCAR PRODUTO POR ID ✅
   ============================ */
export const buscarProduto = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const produto = await prisma.produto.findFirst({
      where: {
        id,
        empresaId: req.user.id, // garante que é da empresa logada
      },
    });

    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json(produto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar produto" });
  }
};

/* ============================
   CRIAR PRODUTO
   ============================ */
export const criarProduto = async (req, res) => {
  const { nome } = req.body;

  if (!nome?.trim()) {
    return res.status(400).json({ erro: "Nome é obrigatório." });
  }

  try {
    const produto = await prisma.produto.create({
      data: {
        nome: nome.trim(),
        empresaId: req.user.id,
      },
    });

    res.status(201).json(produto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao criar produto" });
  }
};

/* ============================
   ATUALIZAR PRODUTO ✅
   ============================ */
export const atualizarProduto = async (req, res) => {
  const { nome } = req.body;

  if (!nome?.trim()) {
    return res.status(400).json({ erro: "Nome é obrigatório." });
  }

  try {
    const id = Number(req.params.id);

    // garante que pertence à empresa
    const existe = await prisma.produto.findFirst({
      where: {
        id,
        empresaId: req.user.id,
      },
    });

    if (!existe) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const atualizado = await prisma.produto.update({
      where: { id },
      data: { nome: nome.trim() },
    });

    res.json(atualizado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao atualizar produto" });
  }
};

/* ============================
   EXCLUIR PRODUTO
   ============================ */
export const excluirProduto = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // garante que pertence à empresa (evita excluir produto de outra empresa)
    const existe = await prisma.produto.findFirst({
      where: { id, empresaId: req.user.id },
    });

    if (!existe) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    await prisma.produto.delete({ where: { id } });

    res.json({ mensagem: "Produto excluído" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ erro: "Erro ao excluir" });
  }
};
