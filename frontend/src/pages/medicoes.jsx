import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/medicoes.css";
import "../styles/medicaoForm.css";
import Swal from 'sweetalert2';

export default function Medicoes() {
  const [medicoes, setMedicoes] = useState([]);
  const [filtro, setFiltro] = useState("todas"); // todas | pendentes | concluidas
  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [medicaoSelecionada, setMedicaoSelecionada] = useState(null);
  const [itemEditId, setItemEditId] = useState(null);
  const [itemAltura, setItemAltura] = useState("");
  const [itemLargura, setItemLargura] = useState("");
  const [itensEstado, setItensEstado] = useState({});

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
    const result = await Swal.fire({
      title: 'Deseja excluir esta medição?',
      text: "Essa ação não poderá ser desfeita.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/medicoes/${id}`);
      carregar();
      Swal.fire({
        icon: 'success',
        title: 'Medição excluída!',
        showConfirmButton: false,
        timer: 1500
      });
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao excluir medição.',
        confirmButtonColor: '#d33'
      });
    }
  }

  function abrirModal(m) {
    setMedicaoSelecionada(m);
    setItemEditId(null);
    setItemAltura("");
    setItemLargura("");
    const itens = Array.isArray(m?.produtosSelecionados) && m.produtosSelecionados.length > 0
      ? m.produtosSelecionados
      : (m?.produto ? [{ id: m.produto.id, nome: m.produto.nome, quantidade: 1 }] : []);
    const estadoInicial = {};
    itens.forEach((it) => {
      estadoInicial[it.id] = {
        altura: it.altura != null ? Number(it.altura) : 0,
        largura: it.largura != null ? Number(it.largura) : 0,
      };
    });
    setItensEstado(estadoInicial);
    setModalAberto(true);
  }

  async function concluirMedicao() {
    try {
      const origemItens = Array.isArray(medicaoSelecionada?.produtosSelecionados) && medicaoSelecionada.produtosSelecionados.length > 0
        ? medicaoSelecionada.produtosSelecionados
        : (medicaoSelecionada?.produto ? [{ id: medicaoSelecionada.produto.id, nome: medicaoSelecionada.produto.nome, quantidade: 1 }] : []);
      const todosConcluidos = origemItens.length === 0 ? true : origemItens.every((it) => {
        const a = Number(itensEstado[it.id]?.altura ?? it.altura ?? 0);
        const l = Number(itensEstado[it.id]?.largura ?? it.largura ?? 0);
        return a > 0 && l > 0;
      });
      if (!todosConcluidos) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Preencha as dimensões de todos os produtos para finalizar.',
          confirmButtonColor: '#ffc107',
          confirmButtonText: 'OK'
        });
        return;
      }
      const payloadProdutos = origemItens.map((it) => ({
        id: it.id,
        nome: it.nome,
        quantidade: Number(it.quantidade || 1),
        altura: Number((itensEstado[it.id]?.altura ?? it.altura ?? 0)),
        largura: Number((itensEstado[it.id]?.largura ?? it.largura ?? 0)),
      }));
      const obsTexto = medicaoSelecionada?.observacao || medicaoSelecionada?.descricao || "";
      await api.put(`/medicoes/${medicaoSelecionada.id}/concluir`, {
        observacao: obsTexto,
        descricao: obsTexto,
        produtosSelecionados: payloadProdutos,
      });

      setModalAberto(false);
      carregar();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("Falha ao concluir medição:", { status, data, message: err?.message });
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: data?.message || data?.erro || "Erro ao concluir medição.",
        confirmButtonColor: '#d33'
      });
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
            className={`filtro-btn ${filtro === "todas" ? "ativo" : ""}`}
            onClick={() => setFiltro("todas")}
          >
            Todas
          </button>

          <button
            className={`filtro-btn ${filtro === "pendentes" ? "ativo" : ""}`}
            onClick={() => setFiltro("pendentes")}
          >
            Pendentes
          </button>

          <button
            className={`filtro-btn ${filtro === "concluidas" ? "ativo" : ""}`}
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
                    <td>{m.endereco ? `${m.endereco.logradouro}${m.endereco.numero ? ', ' + m.endereco.numero : ''}` : "-"}</td>
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
            <div className="modal-title">Concluir Medição</div>
            <div className="modal-subtitle">{medicaoSelecionada?.cliente?.nome || "-"}</div>
            <div className="modal-items">
              {(() => {
                const itens = Array.isArray(medicaoSelecionada?.produtosSelecionados) && medicaoSelecionada.produtosSelecionados.length > 0
                  ? medicaoSelecionada.produtosSelecionados
                  : (medicaoSelecionada?.produto ? [{ id: medicaoSelecionada.produto.id, nome: medicaoSelecionada.produto.nome, quantidade: 1 }] : []);
                return itens.map((it) => {
                  const a = Number(itensEstado[it.id]?.altura ?? it.altura ?? 0);
                  const l = Number(itensEstado[it.id]?.largura ?? it.largura ?? 0);
                  const ok = a > 0 && l > 0;
                  return (
                    <div key={it.id} className="modal-item-card">
                      <div className="modal-item-head">
                        <span className="modal-item-name">{it.nome || `Produto #${it.id}`}</span>
                        <div className="modal-item-right">
                          <span className={`modal-item-status ${ok ? "ok" : "pendente"}`}>{ok ? "✅" : "⏳"}</span>
                          <button
                            className="btn-outline"
                            onClick={() => {
                              setItemEditId(it.id);
                              setItemAltura(String(itensEstado[it.id]?.altura ?? it.altura ?? ""));
                              setItemLargura(String(itensEstado[it.id]?.largura ?? it.largura ?? ""));
                            }}
                          >
                            {ok ? "Editar" : "Concluir"}
                          </button>
                        </div>
                      </div>
                      {itemEditId === it.id && (
                        <div className="modal-item-edit">
                          <div className="modal-item-grid">
                            <div>
                              <label>Altura (m)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={itemAltura}
                                onChange={(e) => setItemAltura(e.target.value)}
                              />
                            </div>
                            <div>
                              <label>Largura (m)</label>
                              <input
                                type="number"
                                step="0.01"
                                value={itemLargura}
                                onChange={(e) => setItemLargura(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="modal-item-confirm">
                            <button
                              className="btn-primary"
                              onClick={() => {
                                setItensEstado((prev) => ({
                                  ...prev,
                                  [it.id]: {
                                    altura: Number(itemAltura),
                                    largura: Number(itemLargura),
                                  },
                                }));
                                setItemEditId(null);
                                setItemAltura("");
                                setItemLargura("");
                              }}
                            >
                              Confirmar Item
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <div className="modal-actions">
              {(() => {
                const itens = Object.values(itensEstado);
                const todosConcluidos = itens.length === 0 ? true : itens.every((x) => Number(x.altura) > 0 && Number(x.largura) > 0);
                return (
                  <button
                    className={`btn-finalizar ${todosConcluidos ? "habilitado" : "desabilitado"}`}
                    onClick={concluirMedicao}
                    disabled={!todosConcluidos}
                  >
                    {todosConcluidos ? "Finalizar Medição" : "Preencha as dimensões de todos os produtos para finalizar."}
                  </button>
                );
              })()}

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
