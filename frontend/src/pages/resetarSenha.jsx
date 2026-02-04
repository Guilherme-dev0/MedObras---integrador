import { useMemo, useState } from "react";
import "../styles/auth.css";
import api from "../api";
import logoMedobras from "../assets/icons/logoMedobras.jpeg";
import Swal from 'sweetalert2';

export default function ResetarSenha() {
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token"), []);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      Swal.fire({ icon: 'error', title: 'Link inválido', text: 'Solicite uma nova recuperação de senha.', confirmButtonColor: '#d33' });
      return;
    }

    if (novaSenha.length < 6) {
      Swal.fire({ icon: 'warning', title: 'Senha fraca', text: 'A senha deve ter pelo menos 6 caracteres.', confirmButtonColor: '#ffc107', confirmButtonText: 'OK' });
      return;
    }

    if (novaSenha !== confirmarSenha) {
      Swal.fire({ icon: 'warning', title: 'Senhas divergentes', text: 'As senhas não conferem.', confirmButtonColor: '#ffc107', confirmButtonText: 'OK' });
      return;
    }

    setSalvando(true);
    try {
      const res = await api.post("/auth/reset-password", { token, novaSenha });
      const msg = res.data?.message || "Senha atualizada com sucesso.";
      
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: msg,
        confirmButtonColor: '#28a745'
      }).then(() => {
        window.location.href = "/";
      });

    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.message ||
        data?.erro ||
        "Não foi possível redefinir a senha. Solicite um novo link e tente novamente.";
      
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: msg,
        confirmButtonColor: '#d33'
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <img src={logoMedobras} alt="logo" className="login-logo" />
          <h1>Nova senha</h1>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <input
              type="password"
              placeholder="Digite a nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <input
              type="password"
              placeholder="Confirme a nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              required
            />
          </div>

          <button className="login-button" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar nova senha"}
          </button>

          <div className="login-footer">
            <a href="/">Voltar para o login</a>
          </div>
        </form>
      </div>
    </div>
  );
}