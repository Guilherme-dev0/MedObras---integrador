import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import {
  listarProdutos,
  buscarProduto,      // ✅
  criarProduto,
  atualizarProduto,   // ✅
  excluirProduto,
} from "../controllers/produtoController.js";

const router = Router();

router.get("/", auth, listarProdutos);
router.get("/:id", auth, buscarProduto);         // ✅ precisa pro editar
router.post("/", auth, criarProduto);
router.put("/:id", auth, atualizarProduto);      // ✅ precisa pra salvar edição
router.delete("/:id", auth, excluirProduto);

export default router;