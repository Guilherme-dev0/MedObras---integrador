import { useState } from "react";
import api from "../api";
import "../styles/enderecoForm.css";

export default function EnderecoNovo() {
  const [search, setSearch] = useState("");
  const [clientes, setClientes] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);

  const [logradouro, setLogradouro] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");

  async function buscarClientePornome(nome) {
    console.log("Digitou:", nome);
    setSearch(nome);
    if (nome.length < 2) {
      setClientes([]);
      return;
    }

    try {
        console.log("Buscando no backend:", nome);
      const res = await api.get(`/clientes/search/${nome}`);
      console.log("Resultado encontrado:", res.data);
      setClientes(res.data);
    } catch {
      console.log("Erro ao buscar clientes");
    }
  }

  async function salvarEndereco() {
    if (!clienteSelecionado) {
      alert("Selecione um cliente!");
      return;
    }

    try {
      await api.post("/enderecos", {
        clienteId: clienteSelecionado.id,
        logradouro,
        bairro,
        cidade,
        cep,
      });

      alert("Endereço cadastrado com sucesso!");
      window.location.href = "/enderecos";

    } catch {
      alert("Erro ao salvar endereço");
    }
  }

  return (
    <div className="form-container">
      <h2 className="form-title">Cadastrar Endereço</h2>

      {/* Campo de busca com autocomplete */}
      <div className="form-group">
        <label>Cliente</label>
        <input
          type="text"
          placeholder="Digite o nome do cliente…"
          value={search}
          onChange={(e) => buscarClientePornome(e.target.value)}
          className="form-input"
        />

        {/* Lista de sugestões */}
        {clientes.length > 0 && (
          <ul className="autocomplete-box">
            {clientes.map((c) => (
              <li
                key={c.id}
                onClick={() => {
                  setClienteSelecionado(c);
                  setSearch(c.nome);
                  setClientes([]);
                }}
              >
                {c.nome}
              </li>
            ))}
          </ul>
        )}
      </div>

      {clienteSelecionado && (
        <div className="selected-client-box">
          Cliente selecionado: <strong>{clienteSelecionado.nome}</strong>
        </div>
      )}

      {/* FORMULARIO DO ENDEREÇO */}
      <div className="form-group">
        <label>Logradouro</label>
        <input
          type="text"
          value={logradouro}
          onChange={(e) => setLogradouro(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Bairro</label>
        <input
          type="text"
          value={bairro}
          onChange={(e) => setBairro(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>Cidade</label>
        <input
          type="text"
          value={cidade}
          onChange={(e) => setCidade(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label>CEP</label>
        <input
          type="text"
          value={cep}
          onChange={(e) => setCep(e.target.value)}
          className="form-input"
        />
      </div>

      <button className="form-button" onClick={salvarEndereco}>
        Salvar Endereço
      </button>
    </div>
  );
}
