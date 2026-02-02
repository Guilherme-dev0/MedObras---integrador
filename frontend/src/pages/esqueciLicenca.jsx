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
      const res = await api.post("/auth/forgot-license", { email });
      const msg = res.data?.message || "Link gerado (Modo Acadêmico).";
      const resetLink = res.data?.resetLink;
      if (resetLink) {
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
            <h1>Recuperar licença</h1>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button className="login-button" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar link"}
            </button>

            <div className="login-footer">
              <a href="/">Voltar para o login</a>
            </div>
          </form>
        </div>
      </div>

      <ConfirmModal
        titulo="Link de Recuperação"
        mensagem={
          linkGerado
            ? "Esta função serve para representar uma situação real de troca de licença. Clique em Redefinir agora ou cancelar:"
            : ""
        }
        textoConfirmar="Redefinir Agora"
        funcaoConfirmar={() => (window.location.href = linkGerado)}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
