import { Router } from "express"
import auth from "../middlewares/authMiddleware.js"
import { 
  criarEndereco,
  listarEnderecos,
  buscarEndereco,
  listarEnderecosPorCliente,
  deletarEndereco,
  atualizarEndereco
} from "../controllers/enderecoController.js"

const router = Router()

router.post("/", auth, criarEndereco)
router.get("/", auth, listarEnderecos)
router.get("/search", auth, buscarEndereco)
router.get("/cliente/:id", auth, listarEnderecosPorCliente)
router.put("/:id", auth, atualizarEndereco)
router.delete("/:id", auth, deletarEndereco);
export default router
