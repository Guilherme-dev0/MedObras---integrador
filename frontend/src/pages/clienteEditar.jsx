import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/clienteForm.css";

export default function ClienteEditar() {
  const { id } = useParams();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfOriginal, setCpfOriginal] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await api.get(`/clientes`);
      const cliente = res.data.find((c) => c.id == id);

      if (!cliente) return alert("Cliente não encontrado.");

      setNome(cliente.nome);
      setTelefone(cliente.telefone);

      const cpfMascarado = mascararCpf(cliente.cpf);
      setCpf(cpfMascarado);
      setCpfOriginal(cpfMascarado);

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

    if (!validarCPF(cpfLimpo)) {
      setErro("CPF inválido!");
      return;
    }

    try {
      await api.put(`/clientes/${id}`, {
        nome,
        telefone,
        cpf: cpfLimpo,
      });

      alert("Cliente atualizado com sucesso!");
      window.location.href = "/clientes";

    } catch (err) {
      console.log(err);
      setErro("Erro ao atualizar cliente. Verifique CPF duplicado.");
    }
  }

  // ----------- Máscara automática de CPF -----------
  function mascararCpf(valor) {
    let v = valor.replace(/\D/g, "");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
  }

  // ----------- VALIDAÇÃO REAL DE CPF -----------
  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) soma += cpf[i] * (10 - i);
    let dig1 = (soma * 10) % 11;
    if (dig1 === 10) dig1 = 0;
    if (dig1 !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += cpf[i] * (11 - i);
    let dig2 = (soma * 10) % 11;
    if (dig2 === 10) dig2 = 0;
    if (dig2 !== Number(cpf[10])) return false;

    return true;
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
                value={telefone} 
                onChange={(e) => setTelefone(e.target.value)}
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
                  
                  // valida ao digitar
                  if (cpfLimpo.length === 11 && !validarCPF(cpfLimpo)) {
                    setErro("CPF inválido!");
                    setCpf(cpfOriginal); // volta ao original
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
