import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/medicoes.css";
import api from "../api";

export default function MedicoesConcluidas() {
  const [medicoes, setMedicoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [tooltipOpenId, setTooltipOpenId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // { medicaoId, itemId, nome }
  const [editAltura, setEditAltura] = useState("");
  const [editLargura, setEditLargura] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // autocomplete
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const boxRef = useRef(null);

  async function carregar(paramsOverride) {
    try {
      setErro("");
      setLoading(true);

      const params = paramsOverride ?? {};
      if (!paramsOverride) {
        if (busca.trim()) params.q = busca.trim();
        if (de) params.de = de;
        if (ate) params.ate = ate;
      }

      const res = await api.get("/medicoes/concluidas", { params });
      setMedicoes(res.data || []);
    } catch (err) {
      console.error(err);
      setMedicoes([]);
      setErro(
        err.response?.data?.message ||
          err.response?.data?.erro ||
          "Não foi possível carregar as medições concluídas."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutsideTooltip(e) {
      if (!tooltipOpenId) return;
      const closestTooltip = e.target.closest(".tooltip-box");
      const closestBadge = e.target.closest(".inline-badge");
      if (!closestTooltip && !closestBadge) {
        setTooltipOpenId(null);
      }
    }
    function handleKeydown(e) {
      if (e.key === "Escape") {
        setTooltipOpenId(null);
        if (editOpen) setEditOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideTooltip);
    document.addEventListener("keydown", handleKeydown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideTooltip);
      document.removeEventListener("keydown", handleKeydown);
    };
  }, [tooltipOpenId, editOpen]);

  // fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setShowSugestoes(false);
        setHighlightIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const total = medicoes.length;

  const totalArea = useMemo(() => {
    return medicoes.reduce((acc, m) => {
      const itens = Array.isArray(m.produtosSelecionados) && m.produtosSelecionados.length > 0
        ? m.produtosSelecionados
        : [];
      const soma = itens.reduce((s, it) => {
        const a = Number(it.altura || 0);
        const l = Number(it.largura || 0);
        const q = Number(it.quantidade || 1);
        if (a > 0 && l > 0 && q > 0) return s + a * l * q;
        return s;
      }, 0);
      return acc + soma;
    }, 0);
  }, [medicoes]);

  // lista única de clientes presentes nas medições carregadas
  const clientesUnicos = useMemo(() => {
    const map = new Map();
    for (const m of medicoes) {
      const nome = m?.cliente?.nome?.trim();
      if (!nome) continue;
      const key = nome.toLowerCase();
      if (!map.has(key)) map.set(key, nome);
    }
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [medicoes]);

  // sugestões conforme digita
  const sugestoes = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return [];
    return clientesUnicos
      .filter((nome) => nome.toLowerCase().includes(t))
      .slice(0, 8);
  }, [busca, clientesUnicos]);

  function selecionarCliente(nome) {
    setBusca(nome);
    setShowSugestoes(false);
    setHighlightIndex(-1);
    // aplica filtro já com o nome escolhido
    const params = {};
    if (nome.trim()) params.q = nome.trim();
    if (de) params.de = de;
    if (ate) params.ate = ate;
    carregar(params);
  }

  function limparFiltros() {
    setBusca("");
    setDe("");
    setAte("");
    setShowSugestoes(false);
    setHighlightIndex(-1);
    setTimeout(() => carregar({}), 0);
  }

  function onKeyDownBusca(e) {
    if (!showSugestoes || sugestoes.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, sugestoes.length - 1));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    }

    if (e.key === "Enter") {
      if (highlightIndex >= 0 && sugestoes[highlightIndex]) {
        e.preventDefault();
        selecionarCliente(sugestoes[highlightIndex]);
      }
    }

    if (e.key === "Escape") {
      setShowSugestoes(false);
      setHighlightIndex(-1);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header-pro">
        <div>
          <h2 className="page-title">Medições Concluídas</h2>

          {/* “balão” */}
          <div className="subtitle-pill">
            Histórico completo das medições finalizadas
          </div>
        </div>

        <button
          className="btn-primary btn-sm"
          onClick={() => carregar()}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="stats-grid refined">
        <div className="stat-card refined">
          <span className="stat-label">Total de medições concluídas</span>
          <div className="stat-value">{total}</div>
          <span className="stat-foot">Registros finalizados no sistema</span>
        </div>

        <div className="stat-card refined">
          <span className="stat-label">Área total medida (aprox.)</span>
          <div className="stat-value">{totalArea.toFixed(2)} m²</div>
          <span className="stat-foot">Soma de altura × largura por medição</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="filter-group" ref={boxRef} style={{ position: "relative" }}>
            <label>Buscar</label>

            <input
              className="search-input"
              placeholder="Digite o nome do cliente..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setShowSugestoes(true);
                setHighlightIndex(-1);
              }}
              onFocus={() => {
                if (busca.trim()) setShowSugestoes(true);
              }}
              onKeyDown={onKeyDownBusca}
            />

            {/* Sugestões */}
            {showSugestoes && sugestoes.length > 0 && (
              <div className="autocomplete-box">
                {sugestoes.map((nome, idx) => (
                  <button
                    type="button"
                    key={nome}
                    className={
                      "autocomplete-item " + (idx === highlightIndex ? "active" : "")
                    }
                    onClick={() => selecionarCliente(nome)}
                  >
                    {nome}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="filter-group">
            <label>De</label>
            <input
              className="date-input"
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Até</label>
            <input
              className="date-input"
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button
              className="btn-secondary"
              onClick={() => carregar()}
              disabled={loading}
            >
              Aplicar
            </button>

            <button className="btn-ghost" onClick={limparFiltros} disabled={loading}>
              Limpar
            </button>
          </div>
        </div>

        {erro && <div className="alert-error">{erro}</div>}
      </div>

      {/* Tabela */}
      <div className="list-container pro">
        {loading && <p className="loading-text">Carregando...</p>}

        {!loading && medicoes.length === 0 && (
          <div className="empty-box">
            <div className="empty-title">Nenhuma medição concluída</div>
            <div className="empty-text">
              Ajuste os filtros ou conclua uma medição pendente.
            </div>
          </div>
        )}

        {!loading && medicoes.length > 0 && (
          <table className="list-table pro">
            <thead>
              <tr>
                <th className="col-cliente">Cliente</th>
                <th className="col-endereco">Endereço</th>
                <th className="col-produtos">Produtos</th>
                <th>Altura</th>
                <th>Largura</th>
                <th>Área</th>
                <th className="col-obs">Obs</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>
              {medicoes.map((m) => {
                const itensArea = Array.isArray(m.produtosSelecionados) && m.produtosSelecionados.length > 0
                  ? m.produtosSelecionados
                  : [];
                const area = itensArea.length > 0
                  ? itensArea.reduce((s, it) => {
                      const a = Number(it.altura || 0);
                      const l = Number(it.largura || 0);
                      const q = Number(it.quantidade || 1);
                      if (a > 0 && l > 0 && q > 0) return s + a * l * q;
                      return s;
                    }, 0)
                  : null;
                const altura = m.altura ? Number(m.altura) : null;
                const largura = m.largura ? Number(m.largura) : null;
                const itens = Array.isArray(m.produtosSelecionados) && m.produtosSelecionados.length > 0
                  ? m.produtosSelecionados
                  : (m?.produto ? [{ id: m.produto.id, nome: m.produto.nome || "", quantidade: 1 }] : []);
                const totalItens = itens.reduce((acc, it) => acc + Number(it.quantidade || 1), 0);
                const obsTexto = m.observacao || m.descricao || "";

                return (
                  <tr key={m.id}>
                    <td>{m.cliente?.nome || "-"}</td>
                    <td>
                      {m.endereco
                        ? `${m.endereco.logradouro}, ${m.endereco.bairro} – ${m.endereco.cidade}`
                        : "-"}
                    </td>
                    <td>
                      {totalItens > 0 ? (
                        <span
                          className="inline-badge with-icon"
                          onClick={() => setTooltipOpenId(tooltipOpenId === `p-${m.id}` ? null : `p-${m.id}`)}
                          onMouseEnter={() => setTooltipOpenId(`p-${m.id}`)}
                          onMouseLeave={() => setTooltipOpenId(null)}
                          style={{ position: "relative", cursor: "pointer" }}
                        >
                          <span className="icon">📦</span>
                          <span className="text">{totalItens} itens</span>
                          {tooltipOpenId === `p-${m.id}` && (
                            <div className="tooltip-box">
                              {itens.map((it) => {
                                return (
                                  <button
                                    key={it.id}
                                    type="button"
                                    className="tooltip-row button-like"
                                    onClick={() => {
                                      setEditTarget({ medicaoId: m.id, itemId: it.id, nome: it.nome || `Produto #${it.id}` });
                                      setEditAltura(it.altura != null ? String(it.altura) : "");
                                      setEditLargura(it.largura != null ? String(it.largura) : "");
                                      setTooltipOpenId(null);
                                      setEditOpen(true);
                                    }}
                                  >
                                    <span className="tooltip-name">{it.nome || `Produto #${it.id}`}</span>
                                    <span className="tooltip-qty">× {Number(it.quantidade || 1)}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{altura ? altura.toFixed(2) : "-"}</td>
                    <td>{largura ? largura.toFixed(2) : "-"}</td>
                    <td>{area ? `${area.toFixed(2)} m²` : "-"}</td>
                    <td className="obs-cell">
                      {obsTexto ? (
                        <span
                          className="inline-badge with-icon"
                          onClick={() => setTooltipOpenId(tooltipOpenId === `o-${m.id}` ? null : `o-${m.id}`)}
                          onMouseEnter={() => setTooltipOpenId(`o-${m.id}`)}
                          onMouseLeave={() => setTooltipOpenId(null)}
                          style={{ position: "relative", cursor: "pointer" }}
                        >
                          <span className="icon">💬</span>
                          {tooltipOpenId === `o-${m.id}` && (
                            <div className="tooltip-box wide">
                              <div className="tooltip-text">{obsTexto}</div>
                            </div>
                          )}
                        </span>
                      ) : (
                        <span className="inline-badge disabled">
                          <span className="icon">💬</span>
                        </span>
                      )}
                    </td>
                    <td>
                      {m.dataAgendada
                        ? new Date(m.dataAgendada).toLocaleDateString("pt-BR")
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-title">Editar Medição</div>
            <div className="modal-subtitle">{editTarget?.nome || "-"}</div>
            <div className="modal-item-edit">
              <div className="modal-item-grid">
                <div>
                  <label>Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAltura}
                    onChange={(e) => setEditAltura(e.target.value)}
                    autoFocus
                  />
                </div>
                <div>
                  <label>Largura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editLargura}
                    onChange={(e) => setEditLargura(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setEditOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn-primary"
                  onClick={async () => {
                    try {
                      const alturaNum = editAltura ? Number(editAltura) : null;
                      const larguraNum = editLargura ? Number(editLargura) : null;
                      const medicao = medicoes.find((x) => x.id === editTarget.medicaoId);
                      if (!medicao) {
                        setEditOpen(false);
                        return;
                      }
                      const itens = Array.isArray(medicao.produtosSelecionados) && medicao.produtosSelecionados.length > 0
                        ? medicao.produtosSelecionados
                        : (medicao?.produto ? [{ id: medicao.produto.id, nome: medicao.produto.nome || "", quantidade: 1 }] : []);

                      await api.put(`/medicoes/${medicao.id}`, {
                        produtosSelecionados: itens.map((it) => ({
                          id: it.id,
                          nome: it.nome,
                          quantidade: Number(it.quantidade || 1),
                          altura: it.id === editTarget.itemId ? alturaNum : (it.altura != null ? Number(it.altura) : null),
                          largura: it.id === editTarget.itemId ? larguraNum : (it.largura != null ? Number(it.largura) : null),
                        })),
                      });

                      setMedicoes((prev) =>
                        prev.map((x) =>
                          x.id === medicao.id
                            ? {
                                ...x,
                                produtosSelecionados: itens.map((it) =>
                                  it.id === editTarget.itemId
                                    ? {
                                        ...it,
                                        altura: alturaNum,
                                        largura: larguraNum,
                                      }
                                    : it
                                ),
                              }
                            : x
                        )
                      );

                      setEditOpen(false);
                    } catch {
                      alert("Erro ao salvar edição.");
                    }
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
