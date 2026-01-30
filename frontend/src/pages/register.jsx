import { useState } from "react";
import "../styles/register.css";

// Ícones
import user from "../assets/icons/user.jpg";
import phone from "../assets/icons/phone.jpg";
import mail from "../assets/icons/mail.jpg";
import lock from "../assets/icons/lock.png";
import file from "../assets/icons/file.png";

// LOGO
import logo from "../assets/icons/logoMedobras.jpeg";

import api from "../api";

export default function Register() {
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  function maskCnpj(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{2})$/, "$1-$2")
      .slice(0, 18);
  }

  function maskPhone(value) {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 15);
  }

  async function handleRegister(e) {
    e.preventDefault();

    const cnpjLimpo = cnpj.replace(/\D/g, "");
    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (cnpjLimpo.length !== 14) {
      alert("O CNPJ deve conter 14 números.");
      return;
    }

    if (telefoneLimpo.length !== 11) {
      alert("O telefone deve conter 11 números.");
      return;
    }

    try {
      const res = await api.post("/empresas/register", {
        nome,
        cnpj: cnpjLimpo,
        telefone: telefoneLimpo,
        email,
        senha,
      });

      const licencaGerada = res.data.licenca;

      alert(
        'Empresa cadastrada com sucesso!\n\n📌 Sua licença é: ' + res.data.licenca + '\n\nGuarde-a! Você precisará para fazer o login.'
      );

      window.location.href = "/";

    } catch (err) {
      alert("Erro ao cadastrar: " + (err.response?.data?.erro || ""));
    }
  }

  return (
    <div className="register-container">
      <div className="register-box">
        <img src={logo} alt="MedObras" className="register-logo" />

        <h2 className="register-title">Criar Conta</h2>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="register-field">
            <img src={user} alt="nome" />
            <input
              type="text"
              className="register-input"
              placeholder="Nome da empresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <img src={file} alt="cnpj" />
            <input
              type="text"
              className="register-input"
              placeholder="CNPJ"
              value={cnpj}
              onChange={(e) => setCnpj(maskCnpj(e.target.value))}
              required
            />
          </div>

          <div className="register-field">
            <img src={phone} alt="telefone" />
            <input
              type="text"
              className="register-input"
              placeholder="Telefone"
              value={telefone}
              onChange={(e) => setTelefone(maskPhone(e.target.value))}
              required
            />
          </div>

          <div className="register-field">
            <img src={mail} alt="email" />
            <input
              type="email"
              className="register-input"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-field">
            <img src={lock} alt="senha" />
            <input
              type="password"
              className="register-input"
              placeholder="Senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button className="register-button">Criar Conta</button>

          <div className="register-links">
            Já possui conta? <a href="/">Entrar</a>
          </div>
        </form>
      </div>
    </div>
  );
}