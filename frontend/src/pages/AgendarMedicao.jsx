import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/medicaoForm.css";
import Swal from 'sweetalert2';

export default function AgendarMedicao() {
  const [clientes, setClientes] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecosLoading, setEnderecosLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [enderecoId, setEnderecoId] = useState("");
  // múltiplos produtos via JSON
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const [dataAgendada, setDataAgendada] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isItemsExpanded, setIsItemsExpanded] = useState(false);

  const [buscaCliente, setBuscaCliente] = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [buscaEndereco, setBuscaEndereco] = useState("");
  const [showSugEnderecos, setShowSugEnderecos] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [showSugProduto, setShowSugProduto] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editAltura, setEditAltura] = useState("");
  const [editLargura, setEditLargura] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarClientes();
    carregarProdutos();
  }, []);

  async function carregarClientes() {
    try {
      const res = await api.get("/clientes");
      setClientes(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar clientes:", err);
      setErro("Não foi possível carregar a lista de clientes.");
    }
  }

  async function carregarEnderecos(clienteIdSelecionado) {
    try {
      setEnderecosLoading(true);
      const res = await api.get(`/enderecos/cliente/${clienteIdSelecionado}`);
      setEnderecos(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar endereços:", err);
      setEnderecos([]);
      setErro("Não foi possível carregar os endereços do cliente selecionado.");
    } finally {
      setEnderecosLoading(false);
    }
  }

  async function carregarProdutos() {
    try {
      const res = await api.get("/produtos");
      setProdutos(res.data || []);
    } catch (err) {
      console.error("Erro ao carregar produtos:", err);
      setErro("Não foi possível carregar a lista de produtos.");
    }
  }

  async function buscarClientes(valor) {
    try {
      const termo = String(valor || "").trim();
      if (termo.length < 1) {
        setClientes([]);
        setShowSugestoes(false);
        return;
      }
      const url = `/clientes/search/${encodeURIComponent(termo)}?t=${Date.now()}`;
      const res = await api.get(url, { headers: { "Cache-Control": "no-cache" } });
      if (res.status === 304) {
        console.log("Resultados da busca (304 cache): mantendo lista atual");
        return;
      }
      console.log("Resultados da busca:", res.data);
      setClientes(res.data || []);
      setShowSugestoes(true);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      setClientes([]);
      setShowSugestoes(false);
    }
  }

  const clientesSugeridos = useMemo(() => {
    const q = buscaCliente.trim();
    if (!q) return [];
    const normalizar = (s) =>
      String(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const qn = normalizar(q);
    return clientes
      .filter((c) => {
        const nome = normalizar(c.nome || "");
        const tel = normalizar(c.telefone || "");
        const cpf = normalizar(c.cpf || "");
        return nome.includes(qn) || tel.includes(qn) || cpf.includes(qn);
      })
      .slice(0, 6);
  }, [buscaCliente, clientes]);

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

  function selecionarCliente(id, nome) {
    setClienteId(String(id));
    setBuscaCliente(nome);
    setEnderecoId("");
    setEnderecos([]);
    setErro("");
    carregarEnderecos(id);
    setClientes([]);
    setShowSugestoes(false);
  }

  function adicionarProduto() {
    const idNum = Number(produtoSelecionadoId);
    const qtdNum = Number(quantidade);
    if (!idNum || isNaN(qtdNum) || qtdNum <= 0) return;
    const prod = produtos.find((p) => Number(p.id) === idNum);
    const item = {
      id: idNum,
      nome: prod?.nome || "",
      quantidade: qtdNum,
    };
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
    setErro("");
    console.log("Form disparado por:", e.nativeEvent?.submitter);

    if (!clienteId || !enderecoId || !dataAgendada) {
      return setErro("Cliente, endereço e data/hora são obrigatórios.");
    }

    try {
      setLoading(true);
      await api.post("/medicoes", {
        clienteId: Number(clienteId),
        enderecoId: Number(enderecoId),
        produtosSelecionados: Array.isArray(produtosSelecionados)
          ? produtosSelecionados
          : [],
        dataAgendada,
        descricao,
      });
      
      const Toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });
      
      Toast.fire({
        icon: 'success',
        title: 'Medição agendada com sucesso!'
      });
      
      setTimeout(() => {
        window.location.href = "/medicoes";
      }, 1000);
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.erro ||
        "Não foi possível agendar a medição. Verifique os dados e tente novamente.";
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  const clienteSelecionado = useMemo(() => {
    if (!clienteId) return null;
    const found = clientes.find((c) => String(c.id) === String(clienteId));
    return found || { id: clienteId, nome: buscaCliente };
  }, [clientes, clienteId, buscaCliente]);

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
          <div className="mb-card-label">Cliente selecionado</div>
          <div className="mb-card-value">
            {clienteSelecionado ? clienteSelecionado.nome : "Escolha um cliente para continuar"}
          </div>
          <div className="mb-card-sub">Atualize abaixo</div>
        </div>
        <div className="mb-card">
          <div className="mb-card-label">Endereços disponíveis</div>
          <div className="mb-card-value">{clienteId ? enderecos.length : "Selecione um cliente"}</div>
          <div className="mb-card-sub">Carregados para este cliente</div>
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
                value={buscaCliente}
                onChange={(e) => {
                  const v = e.target.value;
                  setBuscaCliente(v);
                  buscarClientes(v);
                  setShowSugestoes(true);
                }}
                onFocus={() => setShowSugestoes(true)}
                required
              />
              {showSugestoes && clientesSugeridos.length > 0 && (
                <div className="autocomplete-box">
                  {clientesSugeridos.map((c) => (
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
                        const a =
                          editAltura.trim() === "" ? null : Number(editAltura.replace(",", "."));
                        const l =
                          editLargura.trim() === "" ? null : Number(editLargura.replace(",", "."));
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
              className="mb-input mb-textarea"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Ligar para o cliente antes • Janela da cozinha • Vidro fumê"
            />
          </div>

          <div className="mb-actions center">
            <button
              className="mb-btn-primary"
              type="submit"
              disabled={
                loading ||
                (clienteId && !enderecosLoading && enderecos.length === 0) ||
                enderecosLoading
              }
            >
              {loading ? "Agendando..." : "Agendar Medição"}
            </button>

            <Link to="/medicoes" className="mb-btn-ghost">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
