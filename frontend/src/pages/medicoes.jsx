import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/medicoes.css";

export default function Medicoes() {
  const [medicoes, setMedicoes] = useState([]);
  const [filtro, setFiltro] = useState("todas"); // todas | pendentes | concluidas
  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [medicaoSelecionada, setMedicaoSelecionada] = useState(null);
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const res = await api.get("/medicoes");
      setMedicoes(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar medições:", err);
    }
  }

  async function excluir(id) {
    if (!window.confirm("Deseja realmente excluir esta medição?")) return;

    try {
      await api.delete(`/medicoes/${id}`);
      carregar();
    } catch {
      alert("Erro ao excluir medição.");
    }
  }

  function abrirModal(m) {
    setMedicaoSelecionada(m);
    setAltura("");
    setLargura("");
    setObservacao("");
    setModalAberto(true);
  }

  async function concluirMedicao() {
    try {
      await api.put(`/medicoes/${medicaoSelecionada.id}/concluir`, {
        altura,
        largura,
        observacao,
      });

      setModalAberto(false);
      carregar();
    } catch {
      alert("Erro ao concluir medição.");
    }
  }

  /* ============================
     FILTRO + BUSCA
     ============================ */
  const medicoesFiltradas = useMemo(() => {
    return medicoes.filter((m) => {
      const isConcluida = m.status === "concluída" || m.status === "concluido";
      const isPendente = m.status === "pendente";

      const statusOk =
        filtro === "todas"
          ? true
          : filtro === "pendentes"
          ? isPendente
          : isConcluida;

      const texto = `${m.cliente?.nome || ""} ${m.endereco?.logradouro || ""}`.toLowerCase();
      const buscaOk = texto.includes(busca.toLowerCase());

      return statusOk && buscaOk;
    });
  }, [medicoes, filtro, busca]);

  /* ============================
     RESUMO
     ============================ */
  const total = medicoes.length;
  const pendentes = medicoes.filter((m) => m.status === "pendente").length;
  const concluidas = medicoes.filter(
    (m) => m.status === "concluída" || m.status === "concluido"
  ).length;

  return (
    <div className="page-container">
      <h2 className="page-title">Medições</h2>

      {/* AÇÃO PRINCIPAL (menor) */}
      <div className="top-actions">
        <Link to="/medicoes/nova" style={{ textDecoration: "none" }}>
          <button className="btn-primary btn-primary-sm">Nova Medição</button>
        </Link>
      </div>

      {/* CARDS RESUMO */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total</span>
          <strong>{total}</strong>
        </div>

        <div className="stat-card warning">
          <span>Pendentes</span>
          <strong>{pendentes}</strong>
        </div>

        <div className="stat-card success">
          <span>Concluídas</span>
          <strong>{concluidas}</strong>
        </div>
      </div>

      {/* FILTROS + BUSCA */}
      <div className="filters-bar">
        <div className="filtros">
          <button
            className={filtro === "todas" ? "ativo" : ""}
            onClick={() => setFiltro("todas")}
          >
            Todas
          </button>

          <button
            className={filtro === "pendentes" ? "ativo" : ""}
            onClick={() => setFiltro("pendentes")}
          >
            Pendentes
          </button>

          <button
            className={filtro === "concluidas" ? "ativo" : ""}
            onClick={() => setFiltro("concluidas")}
          >
            Concluídas
          </button>
        </div>

        <input
          className="search-input"
          placeholder="Buscar por cliente ou endereço..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* LISTAGEM */}
      <div className="list-container">
        {medicoesFiltradas.length === 0 ? (
          <p className="empty-text">Nenhuma medição encontrada.</p>
        ) : (
          <table className="list-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Endereço</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {medicoesFiltradas.map((m) => {
                const isPendente = m.status === "pendente";

                return (
                  <tr key={m.id}>
                    <td>{m.cliente?.nome || "-"}</td>
                    <td>{m.endereco?.logradouro || "-"}</td>
                    <td>
                      {m.dataAgendada
                        ? `${new Date(m.dataAgendada).toLocaleDateString("pt-BR")} ${new Date(
                            m.dataAgendada
                          ).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "-"}
                    </td>

                    <td>
                      <span className={`badge ${m.status}`}>
                        {String(m.status || "").toUpperCase()}
                      </span>
                    </td>

                    <td className="acoes">
                      <button
                        className="btn-edit"
                        onClick={() => (window.location.href = `/medicoes/editar/${m.id}`)}
                        title="Editar"
                      >
                        ✏️
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() => excluir(m.id)}
                        title="Excluir"
                      >
                        🗑️
                      </button>

                      {/* ✅ Concluir somente para pendentes */}
                      {isPendente && (
                        <button className="btn-concluir" onClick={() => abrirModal(m)}>
                          ✔️ Concluir
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL CONCLUSÃO */}
      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Concluir Medição</h3>

            <label>Altura (m)</label>
            <input
              type="number"
              step="0.01"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
            />

            <label>Largura (m)</label>
            <input
              type="number"
              step="0.01"
              value={largura}
              onChange={(e) => setLargura(e.target.value)}
            />

            <label>Observação</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />

            <div className="modal-actions">
              <button className="btn-primary" onClick={concluirMedicao}>
                Salvar
              </button>

              <button className="btn-cancel" onClick={() => setModalAberto(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}