import jwt from "jsonwebtoken";

export default function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ erro: "Token não informado" });
  }

  // Remove espaços antes/depois
  let token = header.trim();

  // Se vier "Bearer xxxxx"
  if (token.includes(" ")) {
    token = token.split(" ")[1];
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Erro ao verificar token:", error);
    return res.status(401).json({ erro: "Token expirado ou inválido" });
  }
}
