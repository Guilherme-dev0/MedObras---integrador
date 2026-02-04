import { useState } from "react";
import "../styles/auth.css";
import api from "../api";
import logoMedobras from "../assets/icons/logoMedobras.jpeg";
import Swal from "sweetalert2";

export default function EsqueciLicenca() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [tokenRecuperacao, setTokenRecuperacao] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);

    try {
      // Endpoint corrigido: /auth/forgot-license
      const res = await api.post("/auth/forgot-license", { email });
      const msg = res.data?.message || "Link de recuperação enviado.";
      const resetLink = res.data?.resetLink;

      if (resetLink) {
        // Extrair token do link para uso direto
        try {
          const urlObj = new URL(resetLink);
          const token = urlObj.searchParams.get("token");
          
          if (token) {
            setTokenRecuperacao(token);
            
            // Fluxo direto/simulado de confirmação via Swal
            const result = await Swal.fire({
              title: 'Recuperação de Licença',
              text: 'Deseja gerar uma nova licença para este CNPJ agora?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonColor: '#0056b3',
              cancelButtonColor: '#6c757d',
              confirmButtonText: 'Sim, gerar nova licença',
              cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
               await redefinirLicenca(token);
            }

          } else {
            Swal.fire('Erro', "Erro ao processar token de recuperação.", 'error');
          }
        } catch {
          Swal.fire('Erro', "Erro ao processar link de recuperação.", 'error');
        }
      } else {
        Swal.fire('Informação', msg, 'info');
      }
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.message ||
        data?.erro ||
        "Não foi possível enviar a solicitação. Verifique o e-mail e tente novamente.";
      Swal.fire('Erro', msg, 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function redefinirLicenca(token) {
    if (!token) return;

    try {
      const res = await api.post("/auth/reset-license", { token });
      if (res.data && res.data.success) {
        const novaLicenca = res.data.novaLicenca;
        
        // Exibir SweetAlert com a nova licença
        Swal.fire({
          title: 'Sucesso!',
          html: `Sua nova licença foi gerada: <strong style="font-size: 24px; color: #007bff;">${novaLicenca}</strong>. 📍 Guarde-a com segurança.`,
          icon: 'success',
          background: '#f4f4f4',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#0056b3'
        });
      } else {
        Swal.fire('Erro', "Erro ao redefinir licença.", 'error');
      }
    } catch (err) {
      Swal.fire('Erro', "Erro ao redefinir licença: " + (err.response?.data?.message || err.message), 'error');
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
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={enviando}
              />
            </div>

            <button className="login-button" disabled={enviando}>
              {enviando ? "Enviando..." : "Recuperar Licença"}
            </button>

            <div className="login-footer">
              <a href="/">Voltar para o login</a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
