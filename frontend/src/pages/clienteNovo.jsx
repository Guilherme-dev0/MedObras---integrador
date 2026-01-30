import { useState } from "react";
import api from "../api";
import "../styles/clienteForm.css";

/* ===== Validação CPF (mantida) ===== */
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 1; i <= 9; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);

  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++)
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf.substring(10, 11));
}

function mascararCpf(valor) {
  let v = valor.replace(/\D/g, "");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

export default function ClienteNovo() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (!validarCPF(cpf)) {
      setErro("❌ CPF inválido.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/clientes", {
        nome,
        telefone,
        cpf: cpf.replace(/\D/g, ""),
      });

      alert("Cliente cadastrado com sucesso!");
      window.location.href = "/clientes";
    } catch {
      setErro("❌ CPF já cadastrado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="mb-form-card">
        <h2 className="page-title">Cadastrar Cliente</h2>

        <div className="mb-pill">
          Preencha os dados do cliente para cadastrá-lo no sistema
        </div>

        {erro && <div className="mb-alert">{erro}</div>}

        <form onSubmit={salvar}>
          <div className="mb-grid">
            <div className="mb-field">
              <label>Nome</label>
              <input
                className="mb-input"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="mb-field">
              <label>Telefone</label>
              <input
                className="mb-input"
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>

            <div className="mb-field">
              <label>CPF</label>
              <input
                className="mb-input"
                type="text"
                maxLength="14"
                value={cpf}
                onChange={(e) => setCpf(mascararCpf(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="mb-actions">
            <button className="mb-btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              className="mb-btn-ghost"
              onClick={() => window.history.back()}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}