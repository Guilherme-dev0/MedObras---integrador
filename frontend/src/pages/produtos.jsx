import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/listas.css";
import Swal from 'sweetalert2';

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState("nome_asc");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      setErro("");
      setLoading(true);
      const res = await api.get("/produtos");
      setProdutos(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setProdutos([]);
      setErro("Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirProduto(p) {
    if (!p) return;
    const result = await Swal.fire({
      title: 'Excluir produto',
      text: `Tem certeza que deseja excluir ${p.nome}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/produtos/${p.id}`);
      carregar();
      Swal.fire({
        icon: 'success',
        title: 'Produto excluído!',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (err) {
      console.error(err);
      setErro("Erro ao excluir o produto.");
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao excluir produto.', confirmButtonColor: '#d33' });
    }
  }

  const produtosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();

    const base = !q
      ? produtos
      : produtos.filter((p) => (p.nome || "").toLowerCase().includes(q));

    const sorted = [...base].sort((a, b) => {
      if (ordem === "nome_asc") return (a.nome || "").localeCompare(b.nome || "");
      if (ordem === "nome_desc") return (b.nome || "").localeCompare(a.nome || "");
      if (ordem === "recentes") return (b.id || 0) - (a.id || 0); // fallback simples
      return 0;
    });

    return sorted;
  }, [produtos, busca, ordem]);

  const total = produtos.length;

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="prod-header">
        <div>
          <h2 className="page-title">Produtos</h2>
          <div className="prod-pill">
            Cadastre produtos para usar como referência nas medições.
          </div>
        </div>

        <div className="prod-actions">
          <button className="btn-outline" onClick={carregar} disabled={loading}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>

          <Link to="/produtos/novo">
            <button className="btn-primary btn-primary-sm">Novo Produto</button>
          </Link>
        </div>
      </div>

      {/* STATS */}
      <div className="prod-stats">
        <div className="prod-stat-card">
          <div className="prod-stat-label">Total</div>
          <div className="prod-stat-value">{total}</div>
          <div className="prod-stat-foot">Produtos cadastrados</div>
        </div>

        <div className="prod-stat-card">
          <div className="prod-stat-label">Exibindo</div>
          <div className="prod-stat-value">{produtosFiltrados.length}</div>
          <div className="prod-stat-foot">Resultado do filtro</div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="prod-filters">
        <div className="prod-search">
          <label>Buscar</label>
          <input
            className="search-input"
            placeholder="Digite o nome do produto..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="prod-sort">
          <label>Ordenar</label>
          <select
            className="prod-select"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value)}
          >
            <option value="nome_asc">Nome (A–Z)</option>
            <option value="nome_desc">Nome (Z–A)</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </div>

        <div className="prod-filter-actions">
          <button
            className="btn-ghost"
            onClick={() => {
              setBusca("");
              setOrdem("nome_asc");
            }}
            disabled={loading}
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {erro && <div className="alert-error">{erro}</div>}

      {/* TABELA */}
      <div className="list-container pro">
        {loading && <p className="loading-text">Carregando...</p>}

        {!loading && produtosFiltrados.length === 0 && (
          <div className="empty-box">
            <div className="empty-title">Nenhum produto encontrado</div>
            <div className="empty-text">
              Ajuste a busca ou cadastre um novo produto.
            </div>
            <Link to="/produtos/novo">
              <button className="btn-primary btn-primary-sm" style={{ marginTop: 12 }}>
                Cadastrar Produto
              </button>
            </Link>
          </div>
        )}

        {!loading && produtosFiltrados.length > 0 && (
          <table className="list-table pro">
            <thead>
              <tr>
                <th>Nome</th>
                <th style={{ width: 140 }}>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map((p) => (
                <tr key={p.id}>
                  <td className="prod-name">{p.nome || "-"}</td>

                  <td className="acoes">
                    <button
                      className="btn-edit"
                      title="Editar"
                      onClick={() => (window.location.href = `/produtos/editar/${p.id}`)}
                    >
                      ✏️
                    </button>

                    <button
                      className="btn-delete"
                      title="Excluir"
                      onClick={() => excluirProduto(p)}
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
