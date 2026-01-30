import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/medicoes.css";
import api from "../api";

export default function MedicoesConcluidas() {
  const [medicoes, setMedicoes] = useState([]);
  const [busca, setBusca] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");

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
      const a = Number(m.altura);
      const l = Number(m.largura);
      if (!isNaN(a) && !isNaN(l) && a > 0 && l > 0) return acc + a * l;
      return acc;
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
          title="Atualizar lista"
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
                <th>Cliente</th>
                <th>Endereço</th>
                <th>Produto</th>
                <th>Altura</th>
                <th>Largura</th>
                <th>Área</th>
                <th>Obs</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>
              {medicoes.map((m) => {
                const altura = m.altura ? Number(m.altura) : null;
                const largura = m.largura ? Number(m.largura) : null;
                const area =
                  altura && largura && altura > 0 && largura > 0 ? altura * largura : null;

                return (
                  <tr key={m.id}>
                    <td>{m.cliente?.nome || "-"}</td>
                    <td>
                      {m.endereco
                        ? `${m.endereco.logradouro}, ${m.endereco.bairro} – ${m.endereco.cidade}`
                        : "-"}
                    </td>
                    <td>{m.produto?.nome || "-"}</td>
                    <td>{altura ? altura.toFixed(2) : "-"}</td>
                    <td>{largura ? largura.toFixed(2) : "-"}</td>
                    <td>{area ? `${area.toFixed(2)} m²` : "-"}</td>
                    <td className="obs-cell">{m.observacao || "-"}</td>
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
    </div>
  );
}