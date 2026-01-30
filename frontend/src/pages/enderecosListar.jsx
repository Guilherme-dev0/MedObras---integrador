import { useEffect, useState } from "react";
import api from "../api";
import "../styles/enderecosListar.css";

export default function EnderecosListar() {
  const [enderecos, setEnderecos] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await api.get("/enderecos");
      console.log("Retorno do back:", res.data);
      setEnderecos(res.data || []);
    } catch (err) {
      console.log("Erro ao carregar endereços:", err);
    }
  }

  async function excluirEndereco(id) {
    if (!confirm("Tem certeza que deseja excluir este endereço?")) return;

    try {
      await api.delete(`/enderecos/${id}`);
      alert("Endereço excluído com sucesso!");
      carregar();
    } catch (err) {
      alert("Erro ao excluir endereço");
      console.log(err);
    }
  }

  const filtrados = enderecos.filter((e) => {
    const texto = busca.toLowerCase();
    return (
      e.logradouro.toLowerCase().includes(texto) ||
      e.bairro.toLowerCase().includes(texto) ||
      e.cidade.toLowerCase().includes(texto) ||
      e.cliente.nome.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="listar-container">
      <div className="listar-card">
        <div className="listar-header">
          <h2>📍 Endereços Cadastrados</h2>
          <button className="btn-voltar" onClick={() => (window.location.href = "/enderecos")}>
            ⟵ Voltar
          </button>
        </div>

        <input
          type="text"
          className="input-busca"
          placeholder="Buscar por cliente, bairro, cidade ou logradouro..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <table className="tabela">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Logradouro</th>
              <th>Bairro</th>
              <th>Cidade</th>
              <th>CEP</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">
                  Nenhum endereço encontrado.
                </td>
              </tr>
            ) : (
              filtrados.map((e) => (
                <tr key={e.id}>
                  <td>{e.cliente?.nome}</td>
                  <td>{e.logradouro}</td>
                  <td>{e.bairro}</td>
                  <td>{e.cidade}</td>
                  <td>{e.cep}</td>

                  <td className="acoes">

                    {/* Botão Editar */}
                    <button
                      className="btn-edit"
                      onClick={() => (window.location.href = `/enderecos/editar/${e.id}`)}
                    >
                      ✏️
                    </button>

                    {/* Botão Excluir */}
                    <button
                      className="btn-delete"
                      onClick={() => excluirEndereco(e.id)}
                    >
                      🗑️
                    </button>

                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}