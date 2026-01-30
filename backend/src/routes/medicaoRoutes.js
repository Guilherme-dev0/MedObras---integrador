import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";
import {
  listarMedicoes,
  listarPendentes,
  listarConcluidas,
  criarMedicao,
  buscarMedicaoPorId,
  atualizarMedicao,
  atualizarStatus,
  concluirMedicao,
  excluirMedicao,
} from "../controllers/medicaoController.js";

const router = Router();

/* ============================
   ROTAS DE MEDIÇÃO (PROTEGIDAS)
   ============================ */

// LISTAR todas as medições da empresa
router.get("/", auth, listarMedicoes);

// LISTAR medições pendentes
router.get("/pendentes", auth, listarPendentes);

// LISTAR medições concluídas
router.get("/concluidas", auth, listarConcluidas);

// 🔥 BUSCAR UMA MEDIÇÃO (EDITAR)
router.get("/:id", auth, buscarMedicaoPorId);

// CRIAR medição
router.post("/", auth, criarMedicao);

// 🔥 ATUALIZAR MEDIÇÃO (EDIÇÃO COMPLETA)
router.put("/:id", auth, atualizarMedicao);

// ATUALIZAR somente o status da medição
router.patch("/:id/status", auth, atualizarStatus);

// CONCLUIR medição (altura, largura, observação)
router.put("/:id/concluir", auth, concluirMedicao);

// EXCLUIR medição
router.delete("/:id", auth, excluirMedicao);

export default router;