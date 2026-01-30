import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/clientes.css";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data || []);
    } catch {
      console.error("Erro ao carregar clientes");
    }
  }

  async function excluirCliente(id) {
    if (!window.confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      await api.delete(`/clientes/${id}`);
      alert("Cliente excluído com sucesso!");
      carregar();
    } catch {
      alert("Erro ao excluir cliente. Verifique vínculos existentes.");
    }
  }

  // 🔍 filtro simples
  const clientesFiltrados = useMemo(() => {
    const q = busca.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        (c.telefone || "").includes(q)
    );
  }, [clientes, busca]);

  return (
    <div className="page-container">
      <h2 className="page-title">Clientes</h2>

      {/* ações topo */}
      <div className="top-actions">
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por nome ou telefone..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <Link to="/clientes/novo">
          <button className="btn-primary">Cadastrar Novo Cliente</button>
        </Link>
      </div>

      <div className="list-container">
        {clientesFiltrados.length === 0 ? (
          <p className="empty-text">Nenhum cliente encontrado.</p>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cli) => (
                <tr key={cli.id}>
                  <td>{cli.nome}</td>
                  <td>{cli.telefone || "-"}</td>
                  <td className="acoes">
                    <Link to={`/clientes/editar/${cli.id}`}>
                      <button className="btn-edit">Editar</button>
                    </Link>

                    <button
                      className="btn-delete"
                      onClick={() => excluirCliente(cli.id)}
                      title="Excluir cliente"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
