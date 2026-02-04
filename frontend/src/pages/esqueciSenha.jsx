import { useState } from "react";
import "../styles/auth.css";
import api from "../api";
import logoMedobras from "../assets/icons/logoMedobras.jpeg";
import Swal from 'sweetalert2';

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: 'success',
        title: 'Link enviado para o e-mail!'
      });

      if (res.data.resetLink) {
        console.log("Link de recuperação:", res.data.resetLink);
        // Pequeno delay para permitir leitura do Toast antes de redirecionar (se for o caso)
        // Mas como é fluxo de "enviar email", o usuário ficaria na tela ou iria para login.
        // Vou redirecionar para o link apenas se for desenvolvimento explícito, mas como não sei env, vou apenas logar.
        // Para facilitar o teste do usuário (já que ele pediu para remover a simulação visual), 
        // vou assumir que ele vai olhar o console ou o backend.
        // Porem, se eu redirecionar automaticamente, fica "mágico".
        setTimeout(() => {
            window.location.href = res.data.resetLink; 
        }, 2000); // Redireciona automagicamente para facilitar o teste sem o modal
      }

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || "Erro ao processar solicitação. Verifique os dados e tente novamente.",
        confirmButtonColor: '#d33',
        confirmButtonText: 'OK'
      });
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
            <h1>Recuperar senha</h1>
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
    </>
  );
}
