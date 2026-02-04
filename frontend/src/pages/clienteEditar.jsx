import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/clienteForm.css";
import Swal from 'sweetalert2';

/* ===== Helpers de Validação e Máscara ===== */
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
  v = v.slice(0, 11);
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d)/, "$1.$2");
  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  return v;
}

function mascararTelefone(valor) {
  let v = String(valor || "").replace(/\D/g, "");
  v = v.slice(0, 11);

  if (v.length > 10) {
    return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else {
    v = v.replace(/^(\d{2})(\d)/, "($1) $2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
    return v;
  }
}

export default function ClienteEditar() {
  const { id } = useParams();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/clientes`);
      const cliente = res.data.find((c) => c.id == id);

      if (!cliente) return Swal.fire({ icon: 'error', title: 'Erro', text: 'Cliente não encontrado.' });

      setNome(cliente.nome);
      setTelefone(cliente.telefone);

      const cpfMascarado = mascararCpf(cliente.cpf);
      setCpf(cpfMascarado);
    } catch (err) {
      console.error("Erro ao carregar cliente:", err);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar(e) {
    e.preventDefault();

    const cpfLimpo = cpf.replace(/\D/g, "");
    const telLimpo = String(telefone).replace(/\D/g, "");

    if (!validarCPF(cpfLimpo)) {
      setErro("CPF inválido!");
      return;
    }

    try {
      await api.put(`/clientes/${id}`, {
        nome,
        telefone: telLimpo,
        cpf: cpfLimpo,
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
        title: 'Cliente atualizado com sucesso!'
      });
      
      setTimeout(() => {
        window.location.href = "/clientes";
      }, 1000);

    } catch (err) {
      console.log(err);
      setErro("Erro ao atualizar cliente. Verifique CPF duplicado.");
    }
  }

  return (
    <div className="cliente-container">
      <div className="cliente-card">

        <h2>Editar Cliente</h2>

        {erro && <p className="erro-msg">{erro}</p>}

        <form onSubmit={salvar}>

          <div className="linha">
            <div className="campo">
              <label>Nome</label>
              <input 
                type="text" 
                value={nome} 
                onChange={(e) => setNome(e.target.value)}
                required 
              />
            </div>

            <div className="campo">
              <label>Telefone</label>
              <input 
                type="text" 
                maxLength="15"
                placeholder="(00) 00000-0000"
                value={telefone} 
                onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
                required 
              />
            </div>
          </div>

          {/* CPF COM VALIDAÇÃO */}
          <div className="linha">
            <div className="campo">
              <label>CPF</label>
              <input 
                type="text" 
                maxLength="14"
                value={cpf}
                onChange={(e) => {
                  const valor = mascararCpf(e.target.value);
                  setCpf(valor);

                  const cpfLimpo = valor.replace(/\D/g, "");
                  
                  if (cpfLimpo.length === 11) {
                    if (!validarCPF(cpfLimpo)) {
                      setErro("CPF inválido.");
                    } else {
                      setErro("");
                    }
                  } else {
                    setErro("");
                  }
                }}
                required
              />
            </div>
          </div>

          <button className="btn-salvar" disabled={erro !== ""}>
            Salvar
          </button>

        </form>
      </div>
    </div>
  );
}
