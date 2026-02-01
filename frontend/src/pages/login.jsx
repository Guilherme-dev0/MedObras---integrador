import { useState } from "react";
import "../styles/auth.css";

import file from "../assets/icons/file.png";
import lock from "../assets/icons/lock.png";
import key from "../assets/icons/key.jpg";
import logoMedobras from "../assets/icons/logoMedobras.jpeg";

import api from "../api";

export default function Login() {
  const [cnpj, setCnpj] = useState("");
  const [senha, setSenha] = useState("");
  const [licenca, setLicenca] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);
    try {
      const res = await api.post("/empresas/login", {
        cnpj,
        senha,
        licenca,
      });

      // Se seu backend retorna { token }, mantém assim:
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("empresaNome", res.data.empresa.nome);
      localStorage.setItem("empresaEmail", res.data.empresa.email);

      alert("Login realizado com sucesso.");
      window.location.href = "/dashboard";
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.message ||
        data?.erro ||
        "Não foi possível entrar. Verifique seus dados e tente novamente.";

      alert(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <img src={logoMedobras} alt="logo" className="login-logo" />
          <h1>Entrar</h1>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <img src={file} alt="cnpj" />
            <input
              type="text"
              placeholder="CNPJ"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <img src={lock} alt="senha" />
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="login-field">
            <img src={key} alt="licença" />
            <input
              type="text"
              placeholder="Licença"
              maxLength={4}
              value={licenca}
              onChange={(e) => setLicenca(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* ✅ Link de recuperação */}
          <div className="login-footer" style={{ marginTop: 8 }}>
            <a href="/esqueci-senha">Esqueceu a senha?</a>
          </div>

          <button className="login-button" disabled={loading}>
            {loading ? "Carregando..." : "Entrar"}
          </button>
          
          {loading && (
            <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
              <p>Conectando ao servidor...</p>
              <p style={{ fontSize: '0.8rem', color: '#999' }}>
                (A primeira conexão pode levar até 50s para ativar o ambiente seguro)
              </p>
            </div>
          )}

          <div className="login-footer">
            Não possui uma conta? <a href="/register">Inscrever-se</a>
          </div>
        </form>
      </div>
    </div>
  );
}
