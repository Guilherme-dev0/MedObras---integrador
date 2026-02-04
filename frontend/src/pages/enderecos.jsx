import { useState } from "react";
import api from "../api";
import "../styles/enderecos.css";
import Swal from 'sweetalert2';

export default function Enderecos() {
  const [clienteNome, setClienteNome] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);

  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");

  async function buscarCliente(nome) {
    setClienteNome(nome);
    if (nome.length < 1) {
      setSugestoes([]);
      return;
    }

    try {
      const res = await api.get(`/clientes/search/${nome}`);
      setSugestoes(res.data);
    } catch (err) {
      console.log("Erro ao buscar clientes:", err);
    }
  }

  async function cadastrarEndereco(e) {
    e.preventDefault();

    if (!clienteId) {
      Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione um cliente!', confirmButtonColor: '#ffc107', confirmButtonText: 'OK' });
      return;
    }

    try {
      await api.post("/enderecos", {
        clienteId,
        logradouro,
        numero: numero || undefined,
        bairro,
        cidade,
        cep: String(cep).replace(/\D/g, ""),
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
        title: 'Endereço cadastrado com sucesso!'
      });
      
      setClienteNome("");
      setClienteId(null);
      setSugestoes([]);
      setLogradouro("");
      setNumero("");
      setBairro("");
      setCidade("");
      setCep("");
    } catch (error) {
      console.log(error);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao cadastrar endereço.', confirmButtonColor: '#d33' });
    }
  }

  return (
    <div className="end-container">
      <div className="end-card">
        <h2 className="end-title">Cadastrar Endereço</h2>

        {/* CAMPO PARA BUSCAR CLIENTE */}
        <label>Cliente</label>
        <input
          type="text"
          value={clienteNome}
          placeholder="Buscar cliente pelo nome..."
          onChange={(e) => buscarCliente(e.target.value)}
          className="input"
        />

        {sugestoes.length > 0 && (
          <ul className="autocomplete">
            {sugestoes.map((s) => (
              <li
                key={s.id}
                onClick={() => {
                  setClienteNome(s.nome);
                  setClienteId(s.id);
                  setSugestoes([]);
                }}
              >
                <span className="icon">👤</span> {s.nome}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={cadastrarEndereco}>
          <label>Logradouro</label>
          <input
            className="input"
            value={logradouro}
            onChange={(e) => setLogradouro(e.target.value)}
          />
          <label>Número</label>
          <input
            className="input"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
          />

          <label>Bairro</label>
          <input
            className="input"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
          />

          <label>Cidade</label>
          <input
            className="input"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
          />

          <label>CEP</label>
          <input
            className="input"
            maxLength="9"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 8);
              const formatado = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
              setCep(formatado);
            }}
          />

          <button className="btn-primary" type="submit">
            Cadastrar
          </button>
        </form>

        <button className="btn-secondary" onClick={() => (window.location.href = "/enderecos/listar")}>
          📍 Ver Endereços Cadastrados
        </button>
      </div>
    </div>
  );
}
