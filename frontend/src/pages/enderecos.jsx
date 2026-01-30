import { useState } from "react";
import api from "../api";
import "../styles/enderecos.css";

export default function Enderecos() {
  const [clienteNome, setClienteNome] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);

  const [logradouro, setLogradouro] = useState("");
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

    if (!clienteId) return alert("Selecione um cliente!");

    try {
      await api.post("/enderecos", {
        clienteId,
        logradouro,
        bairro,
        cidade,
        cep,
      });

      alert("Endereço cadastrado com sucesso!");
      setClienteNome("");
      setClienteId(null);
      setSugestoes([]);
      setLogradouro("");
      setBairro("");
      setCidade("");
      setCep("");
    } catch (error) {
      console.log(error);
      alert("Erro ao cadastrar endereço.");
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
            value={cep}
            onChange={(e) => setCep(e.target.value)}
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