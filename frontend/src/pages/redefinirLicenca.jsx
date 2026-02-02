import { useMemo, useState } from "react";
import "../styles/auth.css";
import api from "../api";
import logoMedobras from "../assets/icons/logoMedobras.jpeg";

export default function RedefinirLicenca() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token"), []);
  const [processando, setProcessando] = useState(false);

  async function handleConfirmar(e) {
    e.preventDefault();

    if (!token) {
      alert("Link inválido. Solicite uma nova recuperação de licença.");
      return;
    }

    setProcessando(true);
    try {
      const res = await api.post("/auth/reset-license", { token });
      const msg = res.data?.message || "Licença liberada.";
      alert(msg);
      window.location.href = "/";
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.message ||
        data?.erro ||
        "Não foi possível validar o link. Solicite um novo link e tente novamente.";
      alert(msg);
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <img src={logoMedobras} alt="logo" className="login-logo" />
          <h1>Redefinir licença</h1>
        </div>

        <form className="login-form" onSubmit={handleConfirmar}>
          <button className="login-button" disabled={processando}>
            {processando ? "Processando..." : "Redefinir agora"}
          </button>

          <div className="login-footer">
            <a href="/">Voltar para o login</a>
          </div>
        </form>
      </div>
    </div>
  );
}
