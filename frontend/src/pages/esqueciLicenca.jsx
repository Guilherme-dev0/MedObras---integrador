import { useState } from "react";
import "../styles/auth.css";
import api from "../api";
import logoMedobras from "../assets/icons/logoMedobras.jpeg";
import ConfirmModal from "../componentes/ConfirmModal.jsx";

export default function EsqueciLicenca() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [linkGerado, setLinkGerado] = useState("");
  const [showModal, setShowModal] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);

    try {
      // Endpoint corrigido: /auth/forgot-license (que o axios transforma em /api/auth/forgot-license)
      const res = await api.post("/auth/forgot-license", { email });
      const msg = res.data?.message || "Link gerado (Modo Acadêmico).";
      const resetLink = res.data?.resetLink;

      if (resetLink) {
        console.log("LINK LICENÇA (FRONT):", resetLink);
        setLinkGerado(resetLink);
        setShowModal(true);
      } else {
        alert(msg);
      }
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.message ||
        data?.erro ||
        "Não foi possível enviar a solicitação. Verifique o e-mail e tente novamente.";
      alert(msg);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <img src={logoMedobras} alt="logo" className="login-logo" />
            <h1>Recuperar Licença</h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label>E-mail cadastrado</label>
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={enviando}
              />
            </div>

            <button className="login-button" disabled={enviando}>
              {enviando ? "Enviando..." : "Recuperar Licença"}
            </button>
          </form>

          <div className="login-footer">
            <a href="/">Voltar para o Login</a>
          </div>
        </div>
      </div>

      {showModal && (
        <ConfirmModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => setShowModal(false)}
          title="Link Gerado (Modo Acadêmico)"
          message={`Copie o link abaixo para redefinir sua licença:\n\n${linkGerado}`}
        />
      )}
    </>
  );
}
