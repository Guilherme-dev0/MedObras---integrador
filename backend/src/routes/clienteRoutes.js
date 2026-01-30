import { Router } from "express";
import auth from "../middlewares/authMiddleware.js";

import {
  criarCliente,
  listarClientes,
  atualizarCliente,
  deletarCliente,
  buscarClientePorNome
} from "../controllers/clienteController.js";

const router = Router();

router.get("/", auth, listarClientes);
router.post("/", auth, criarCliente);
router.put("/:id", auth, atualizarCliente);
router.delete("/:id", auth, deletarCliente);
router.get("/search/:nome", auth, buscarClientePorNome);
export default router;