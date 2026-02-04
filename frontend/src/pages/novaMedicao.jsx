import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "../styles/medicaoForm.css";

export default function AgendarMedicao() {
  const [clientes, setClientes] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [clienteBusca, setClienteBusca] = useState("");
  const [clienteId, setClienteId] = useState("");

  const [enderecoId, setEnderecoId] = useState("");
  const [buscaEndereco, setBuscaEndereco] = useState("");
  const [showSugEnderecos, setShowSugEnderecos] = useState(false);
  const [dataAgendada, setDataAgendada] = useState("");
  const [observacao, setObservacao] = useState("");

  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editAltura, setEditAltura] = useState("");
  const [editLargura, setEditLargura] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [showSugProduto, setShowSugProduto] = useState(false);

  useEffect(() => {
    carregarClientes();
    carregarProdutos();
  }, []);

  async function carregarClientes() {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data || []);
    } catch {
      setClientes([]);
      setErro("Não foi possível carregar a lista de clientes.");
    }
  }

  async function carregarProdutos() {
    try {
      const res = await api.get("/produtos");
      setProdutos(res.data || []);
    } catch {
      setProdutos([]);
    }
  }

  async function buscarClientes(valor) {
    try {
      const termo = String(valor || "").trim();
      if (!termo) {
        setClientes([]);
        setShowSugestoes(false);
        return;
      }
      const res = await api.get(`/clientes/search/${encodeURIComponent(termo)}?t=${Date.now()}`);
      const lista = Array.isArray(res.data) ? res.data : [];
      const norm = normalize(termo);
      const filtrada = lista.filter((c) => {
        const nome = normalize(c.nome || "");
        const cpf = normalize(c.cpf || "");
        return nome.includes(norm) || cpf.includes(norm);
      });
      setClientes(filtrada);
      setShowSugestoes(true);
    } catch {
      setClientes([]);
      setShowSugestoes(false);
    }
  }

  async function carregarEnderecos(id) {
    try {
      const res = await api.get(`/enderecos/cliente/${id}`);
      setEnderecos(res.data || []);
    } catch {
      setEnderecos([]);
      setErro("Não foi possível carregar os endereços do cliente.");
    }
  }

  function normalize(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  const enderecosFiltrados = useMemo(() => {
    const termo = normalize(buscaEndereco);
    if (!termo) return enderecos;
    return enderecos.filter((e) => {
      const txt = normalize(`${e.logradouro} ${e.bairro} ${e.cidade}`);
      return txt.includes(termo);
    });
  }, [enderecos, buscaEndereco]);

  const produtosFiltrados = useMemo(() => {
    const termo = normalize(buscaProduto);
    if (!termo) return produtos;
    return produtos.filter((p) => normalize(p.nome).includes(termo));
  }, [produtos, buscaProduto]);
  const totalDistintos = useMemo(() => {
    return Array.isArray(produtosSelecionados) ? produtosSelecionados.length : 0;
  }, [produtosSelecionados]);
  const totalGeral = useMemo(() => {
    return Array.isArray(produtosSelecionados)
      ? produtosSelecionados.reduce((acc, it) => acc + Number(it.quantidade || 0), 0)
      : 0;
  }, [produtosSelecionados]);

  function selecionarCliente(id, nome) {
    setClienteId(String(id));
    setClienteBusca(nome);
    setEnderecoId("");
    setEnderecos([]);
    setBuscaEndereco("");
    setErro("");
    carregarEnderecos(id);
    setClientes([]);
    setShowSugestoes(false);
  }
  useEffect(() => {
    setEnderecoId("");
    setBuscaEndereco("");
  }, [clienteId]);

  function adicionarProduto() {
    const idNum = Number(produtoSelecionadoId);
    const qtdNum = Number(quantidade);
    if (!idNum || isNaN(qtdNum) || qtdNum <= 0) return;
    const prod = produtos.find((p) => Number(p.id) === idNum);
    const item = { id: idNum, nome: prod?.nome || "", quantidade: qtdNum };
    setProdutosSelecionados((prev) => {
      const idx = prev.findIndex((x) => Number(x.id) === idNum);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantidade: qtdNum };
        return next;
      }
      return [...prev, item];
    });
    setProdutoSelecionadoId("");
    setQuantidade("");
  }

  async function salvar(e) {
    e.preventDefault();
    if (loading) return;
    setTentouSalvar(true);

    if (!clienteId || !enderecoId || !dataAgendada) {
      setErro("Preencha cliente, endereço e data/hora.");
      return;
    }
    if (!Array.isArray(produtosSelecionados) || produtosSelecionados.length === 0) {
      setErro("Selecione pelo menos um produto para a medição.");
      return;
    }

    try {
      setLoading(true);
      await api.post("/medicoes", {
        clienteId: Number(clienteId),
        enderecoId: Number(enderecoId),
        dataAgendada,
        descricao: observacao,
        produtosSelecionados: Array.isArray(produtosSelecionados) ? produtosSelecionados : [],
      });
      alert("Medição agendada com sucesso!");
      window.location.href = "/medicoes";
    } catch (err) {
      setErro(
        err.response?.data?.message ||
          err.response?.data?.erro ||
          "Erro ao agendar."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container mb-page">
      <div className="mb-header">
        <div>
          <h2 className="page-title mb-title">Agendar Medição</h2>
          <div className="mb-pill">
            Selecione o cliente, o endereço e defina a data/hora da visita.
          </div>
        </div>
        <button
          type="button"
          className="mb-back"
          title="Voltar"
          onClick={() => (window.location.href = "/medicoes")}
        >
          ←
        </button>
      </div>

      <div className="mb-cards">
        <div className="mb-card">
          <div className="mb-card-label">Cliente</div>
          <div className="mb-card-value">
            {clienteId ? (clientes.find((c) => String(c.id) === String(clienteId))?.nome || clienteBusca) : "—"}
          </div>
          <div className="mb-card-sub">
            {Array.isArray(produtosSelecionados) && produtosSelecionados.length > 0
              ? `Produtos distintos selecionados: ${totalDistintos}, total de produtos: ${totalGeral}`
              : "Nenhum produto selecionado"}
          </div>
        </div>
        <div className="mb-card">
          <div className="mb-card-label">Endereço</div>
          <div className="mb-card-value">{enderecoId ? buscaEndereco : "—"}</div>
          <div className="mb-card-sub">Endereços disponíveis ({enderecos.length})</div>
        </div>
      </div>

      <div className="mb-form-card">
        {erro && <div className="mb-alert">{erro}</div>}

        <form onSubmit={salvar}>
          <div className="mb-row-two">
            <div className="mb-field">
              <label>Cliente</label>
              <input
                className="mb-input"
                placeholder="Digite nome, telefone ou CPF..."
                value={clienteBusca}
                onChange={(e) => {
                  const v = e.target.value;
                  setClienteBusca(v);
                  buscarClientes(v);
                  if (v.trim() === "") {
                    setClienteId("");
                    setEnderecos([]);
                    setEnderecoId("");
                    setBuscaEndereco("");
                  }
                  setShowSugestoes(true);
                }}
                onFocus={() => setShowSugestoes(true)}
                required
              />
              {showSugestoes && clientes.length > 0 && (
                <div className="autocomplete-box">
                  {clientes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="autocomplete-item"
                      onMouseDown={() => selecionarCliente(c.id, c.nome)}
                    >
                      <span style={{ display: "inline-flex", width: 20, marginRight: 6 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" fill="var(--accent-clientes)" />
                          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="var(--accent-clientes)" />
                        </svg>
                      </span>
                      {c.nome}
                    </button>
                  ))}
                </div>
              )}
              {tentouSalvar && !clienteId && (
                <div className="mb-hint mb-warn">Selecione um cliente válido.</div>
              )}
            </div>
            <div className="mb-field">
              <label>Data & Hora</label>
              <input
                className="mb-input"
                type="datetime-local"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>

          <div className="mb-field">
            <label>Endereço</label>
            <input
              className="mb-input"
              placeholder={!clienteId ? "Selecione um cliente primeiro..." : "Digite logradouro, bairro ou cidade..."}
              value={buscaEndereco}
              onChange={(e) => {
                const v = e.target.value;
                setBuscaEndereco(v);
                setShowSugEnderecos(true);
              }}
              onFocus={() => setShowSugEnderecos(true)}
              disabled={!clienteId}
              required
            />
            {clienteId && showSugEnderecos && enderecosFiltrados.length > 0 && (
              <div className="autocomplete-box">
                {enderecosFiltrados.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="autocomplete-item"
                    onMouseDown={() => {
                      setEnderecoId(String(e.id));
                      setBuscaEndereco(`${e.logradouro}, ${e.bairro} — ${e.cidade}`);
                      setShowSugEnderecos(false);
                    }}
                  >
                    <span style={{ display: "inline-flex", width: 20, marginRight: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 12 6 12s6-6.75 6-12c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="var(--accent-pink)" />
                      </svg>
                    </span>
                    {e.logradouro}, {e.bairro} — {e.cidade}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-workpanel">
            <div>
              <div className="mb-field">
                <label>Produtos (opcional)</label>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 8 }}>
                  <input
                    className="mb-input"
                    placeholder="Digite para buscar produto..."
                    value={buscaProduto}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBuscaProduto(v);
                      setShowSugProduto(true);
                    }}
                    onFocus={() => setShowSugProduto(true)}
                  />
                  {showSugProduto && produtosFiltrados.length > 0 && (
                    <div className="autocomplete-box">
                      {produtosFiltrados.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="autocomplete-item"
                          onMouseDown={() => {
                            setProdutoSelecionadoId(String(p.id));
                            setBuscaProduto(p.nome);
                            setShowSugProduto(false);
                            setQuantidade("1");
                          }}
                        >
                          <span style={{ display: "inline-flex", width: 20, marginRight: 6 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M3 7l9-5 9 5v10l-9 5-9-5V7z" fill="var(--accent-produtos)" />
                            </svg>
                          </span>
                          {p.nome}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    className="mb-input"
                    type="number"
                    min="1"
                    placeholder="Qtd."
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.preventDefault();
                    }}
                  />
                  <button
                    type="button"
                    className="mb-mini"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      adicionarProduto();
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {Array.isArray(produtosSelecionados) && produtosSelecionados.length > 0 && (
                <>
                  <div className={`mb-items-box ${isItemsExpanded ? "expanded" : "collapsed"}`}>
                    <div className="mb-items-head">
                      <span>Itens adicionados</span>
                      <span>{produtosSelecionados.length}</span>
                    </div>
                    {produtosSelecionados.map((it) => (
                      <div key={it.id} className="mb-item-row">
                        <div className="mb-item-name">{it.nome || `Produto #${it.id}`}</div>
                        <div className="mb-item-qty">Qtd: {it.quantidade}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="mb-item-remove"
                            title="Editar dimensões"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingItemId(it.id);
                              setEditAltura(it.altura != null ? String(it.altura) : "");
                              setEditLargura(it.largura != null ? String(it.largura) : "");
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="mb-item-remove"
                            title="Remover item"
                            onClick={() =>
                              setProdutosSelecionados((prev) =>
                                prev.filter((x) => Number(x.id) !== Number(it.id))
                              )
                            }
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {produtosSelecionados.length > 2 && (
                    <button
                      type="button"
                      className="mb-items-toggle"
                      onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                    >
                      {isItemsExpanded ? "Ver menos" : "Ver tudo"}
                    </button>
                  )}
                </>
              )}
            </div>

            <div>
              {editingItemId != null && (
                <div className="mb-item-edit">
                  <div className="mb-field">
                    <label>Altura (m)</label>
                    <input
                      className="mb-input"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1.20"
                      value={editAltura}
                      onChange={(e) => setEditAltura(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                        if (
                          e.key === "ArrowUp" ||
                          e.key === "ArrowDown" ||
                          e.key === "PageUp" ||
                          e.key === "PageDown"
                        ) {
                          e.preventDefault();
                          const delta =
                            e.key === "ArrowUp"
                              ? 0.01
                              : e.key === "ArrowDown"
                              ? -0.01
                              : e.key === "PageUp"
                              ? 0.1
                              : -0.1;
                          const cur = parseFloat(String(editAltura).replace(",", "."));
                          const base = Number.isNaN(cur) ? 0 : cur;
                          const next = (base + delta).toFixed(2);
                          setEditAltura(next);
                        }
                      }}
                    />
                  </div>
                  <div className="mb-field">
                    <label>Largura (m)</label>
                    <input
                      className="mb-input"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 2.10"
                      value={editLargura}
                      onChange={(e) => setEditLargura(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.preventDefault();
                        if (
                          e.key === "ArrowUp" ||
                          e.key === "ArrowDown" ||
                          e.key === "PageUp" ||
                          e.key === "PageDown"
                        ) {
                          e.preventDefault();
                          const delta =
                            e.key === "ArrowUp"
                              ? 0.01
                              : e.key === "ArrowDown"
                              ? -0.01
                              : e.key === "PageUp"
                              ? 0.1
                              : -0.1;
                          const cur = parseFloat(String(editLargura).replace(",", "."));
                          const base = Number.isNaN(cur) ? 0 : cur;
                          const next = (base + delta).toFixed(2);
                          setEditLargura(next);
                        }
                      }}
                    />
                  </div>
                  <div className="mb-actions">
                    <button
                      type="button"
                      className="mb-btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const a = editAltura.trim() === "" ? null : Number(editAltura.replace(",", "."));
                        const l = editLargura.trim() === "" ? null : Number(editLargura.replace(",", "."));
                        setProdutosSelecionados((prev) =>
                          prev.map((x) =>
                            Number(x.id) === Number(editingItemId) ? { ...x, altura: a, largura: l } : x
                          )
                        );
                        setEditingItemId(null);
                        setEditAltura("");
                        setEditLargura("");
                      }}
                    >
                      Salvar Dimensões
                    </button>
                    <button
                      type="button"
                      className="mb-btn-ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingItemId(null);
                        setEditAltura("");
                        setEditLargura("");
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-field">
            <label>Observação</label>
            <textarea
              className="mb-input"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <div className="mb-actions">
            <button className="mb-btn-primary" type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Agendar Medição"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
