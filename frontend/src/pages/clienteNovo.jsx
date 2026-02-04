import { useState } from "react";
import api from "../api";
import "../styles/clienteForm.css";
import Swal from 'sweetalert2';

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
  v = v.slice(0, 11); // Garante max 11 dígitos
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

function mascararTelefone(valor) {
  let v = String(valor || "").replace(/\D/g, "");
  v = v.slice(0, 11);

  if (v.length > 10) {
    // Máscara para celular (11 dígitos): (00) 00000-0000
    return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else {
    // Máscara para fixo (10 dígitos) ou parcial: (00) 0000-0000
    v = v.replace(/^(\d{2})(\d)/, "($1) $2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
  }
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
        telefone: String(telefone).replace(/\D/g, ""),
        cpf: cpf.replace(/\D/g, ""),
      });

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
        title: 'Cliente cadastrado com sucesso!'
      });
      
      setTimeout(() => {
        window.location.href = "/clientes";
      }, 1000);
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
                maxLength="15"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
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
