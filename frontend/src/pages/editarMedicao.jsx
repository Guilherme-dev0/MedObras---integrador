import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/medicaoForm.css";
import Swal from 'sweetalert2';

export default function EditarMedicao() {
  const { id } = useParams();

  const [clientes, setClientes] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [enderecoId, setEnderecoId] = useState("");

  // ✅ múltiplos produtos via JSON
  const [produtosSelecionados, setProdutosSelecionados] = useState([]);
  const [produtoSelecionadoId, setProdutoSelecionadoId] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const [dataAgendada, setDataAgendada] = useState("");
  const [observacao, setObservacao] = useState("");

  const [isItemsExpanded, setIsItemsExpanded] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editAltura, setEditAltura] = useState("");
  const [editLargura, setEditLargura] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const [buscaCliente, setBuscaCliente] = useState("");
  const [showSugCliente, setShowSugCliente] = useState(false);
  const [buscaEndereco, setBuscaEndereco] = useState("");
  const [showSugEndereco, setShowSugEndereco] = useState(false);
  const [buscaProduto, setBuscaProduto] = useState("");
  const [showSugProduto, setShowSugProduto] = useState(false);
  const [allowEditCliente, setAllowEditCliente] = useState(false);
  const totalDistintos = useMemo(() => {
    return Array.isArray(produtosSelecionados) ? produtosSelecionados.length : 0;
  }, [produtosSelecionados]);
  const totalGeral = useMemo(() => {
    return Array.isArray(produtosSelecionados)
      ? produtosSelecionados.reduce((acc, it) => acc + Number(it.quantidade || 0), 0)
      : 0;
  }, [produtosSelecionados]);

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    setEnderecoId("");
    setBuscaEndereco("");
  }, [clienteId]);

  async function carregarTudo() {
    try {
      setErro("");
      const [resCli, resProd, resMed] = await Promise.all([
        api.get("/clientes"),
        api.get("/produtos"),
        api.get(`/medicoes/${id}`), // se sua API for diferente, me fala qual é
      ]);

      setClientes(resCli.data || []);
      setProdutos(resProd.data || []);

      const med = resMed.data;

      // cliente / endereco
      const cid = String(med.clienteId || "");
      setClienteId(cid);
      setBuscaCliente(med?.cliente?.nome ? String(med.cliente.nome) : "");

      // carrega endereços do cliente
      if (cid) {
        const resEnd = await api.get(`/enderecos/cliente/${cid}`);
        setEnderecos(resEnd.data || []);
        const atual = (resEnd.data || []).find((e) => String(e.id) === String(med.enderecoId));
        setBuscaEndereco(
          atual
            ? `${atual.logradouro}${atual.numero ? ", " + atual.numero : ""}, ${atual.bairro} — ${atual.cidade}`
            : ""
        );
      } else {
        setEnderecos([]);
      }

      setEnderecoId(String(med.enderecoId || ""));

      // data/obs
      setDataAgendada(formatToDateTimeLocal(med.dataAgendada || med.data || ""));
      setObservacao(med.observacao || med.descricao || "");

      // ✅ carregar produtosSelecionados do JSON (se existir)
      if (Array.isArray(med.produtosSelecionados)) {
        setProdutosSelecionados(
          med.produtosSelecionados.map((it) => ({
            id: Number(it.id),
            nome: String(it.nome || ""),
            quantidade: Number(it.quantidade || 1),
            altura: it.altura != null ? Number(it.altura) : null,
            largura: it.largura != null ? Number(it.largura) : null,
          }))
        );
      } else if (med.produto) {
        setProdutosSelecionados([
          {
            id: Number(med.produto.id),
            nome: String(med.produto.nome || ""),
            quantidade: 1,
          },
        ]);
      } else {
        setProdutosSelecionados([]);
      }
    } catch {
      setErro("Não foi possível carregar a medição para edição.");
    }
  }

  async function carregarEnderecos(clienteIdSelecionado) {
    try {
      if (!clienteIdSelecionado) {
        setEnderecos([]);
        return;
      }
      const res = await api.get(`/enderecos/cliente/${clienteIdSelecionado}`);
      setEnderecos(res.data || []);
    } catch {
      setEnderecos([]);
      setErro("Não foi possível carregar os endereços deste cliente.");
    }
  }

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)),
    [clientes, clienteId]
  );

  function normalize(s) {
    return String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  const clientesFiltrados = useMemo(() => {
    const termo = normalize(buscaCliente);
    if (!termo) return clientes;
    return clientes.filter((c) => {
      const nome = normalize(c.nome);
      const cpf = normalize(c.cpf || "");
      return nome.includes(termo) || cpf.includes(termo);
    });
  }, [clientes, buscaCliente]);

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
  const enderecoSelecionado = useMemo(
    () => enderecos.find((e) => String(e.id) === String(enderecoId)),
    [enderecos, enderecoId]
  );

  async function salvar(e) {
    e.preventDefault();
    if (loading) return;
    setErro("");
    console.log("Form disparado por:", e.nativeEvent?.submitter);

    if (!clienteId || !enderecoId || !dataAgendada) {
      setErro("Preencha cliente, endereço e data/hora.");
      return;
    }

    try {
      setLoading(true);

      // payload base
      const payload = {
        clienteId: Number(clienteId),
        enderecoId: Number(enderecoId),
        dataAgendada,
        descricao: observacao,
        observacao: observacao,
      };

      // ✅ envia lista completa via JSON
      payload.produtosSelecionados = Array.isArray(produtosSelecionados)
        ? produtosSelecionados.map((it) => ({
            id: Number(it.id),
            nome: String(it.nome || ""),
            quantidade: Number(it.quantidade || 1),
            altura: it.altura != null ? Number(it.altura) : null,
            largura: it.largura != null ? Number(it.largura) : null,
          }))
        : [];

      await api.put(`/medicoes/${id}`, payload);

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
        title: 'Medição atualizada com sucesso!'
      });
      
      setTimeout(() => {
        window.location.href = "/medicoes";
      }, 1000);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      console.error("Falha ao salvar medição:", { status, data, message: err?.message });
      setErro(
        err.response?.data?.message ||
          err.response?.data?.erro ||
          "Não foi possível salvar as alterações."
      );
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="page-container mb-page">
      {/* HEADER PADRÃO MEDOBRAS */}
      <div className="mb-header">
        <div>
          <h2 className="page-title mb-title">Editar Medição</h2>
          <div className="mb-pill">
            Atualize o cliente, endereço, data/hora e dimensões da medição.
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
            {clienteSelecionado ? clienteSelecionado.nome : "—"}
          </div>
          <div className="mb-card-sub">
            {Array.isArray(produtosSelecionados) && produtosSelecionados.length > 0
              ? `Produtos distintos selecionados: ${totalDistintos}, total de produtos: ${totalGeral}`
              : "Nenhum produto selecionado"}
          </div>
        </div>

        <div className="mb-card">
          <div className="mb-card-label">Endereço</div>
          <div className="mb-card-value">{enderecoSelecionado ? enderecoSelecionado.logradouro : "—"}</div>
          <div className="mb-card-sub">Endereços disponíveis ({enderecos.length})</div>
        </div>
      </div>

      {/* FORM */}
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
                  setShowSugCliente(true);
                }}
                onFocus={() => {
                  if (allowEditCliente) setShowSugCliente(true);
                }}
                required
                readOnly={!allowEditCliente}
                style={{
                  background: allowEditCliente ? "#ffffff" : "#eef2f7",
                  cursor: allowEditCliente ? "text" : "not-allowed",
                }}
              />
              {!allowEditCliente && (
                <button
                  type="button"
                  className="mb-mini"
                  onClick={async () => {
                    const result = await Swal.fire({
                      title: 'Alterar cliente?',
                      text: "Isso limpará o endereço selecionado.",
                      icon: 'question',
                      showCancelButton: true,
                      confirmButtonColor: '#d33',
                      cancelButtonColor: '#6c757d',
                      confirmButtonText: 'Sim, alterar',
                      cancelButtonText: 'Cancelar'
                    });

                    if (result.isConfirmed) {
                      setAllowEditCliente(true);
                      setClienteId("");
                      setBuscaCliente("");
                      setEnderecoId("");
                      setBuscaEndereco("");
                      setEnderecos([]);
                    }
                  }}
                >
                  Trocar
                </button>
              )}
              {showSugCliente && clientesFiltrados.length > 0 && (
                <div className="autocomplete-box">
                  {clientesFiltrados.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="autocomplete-item"
                      onMouseDown={() => {
                        setClienteId(String(c.id));
                        setBuscaCliente(c.nome);
                        setEnderecoId("");
                        setBuscaEndereco("");
                        setEnderecos([]);
                        carregarEnderecos(c.id);
                        setShowSugCliente(false);
                      }}
                    >
                      <span style={{ display: "inline-flex", width: 20, marginRight: 6 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="8" r="4" fill="var(--accent-clientes)" />
                          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="var(--accent-clientes)" />
                        </svg>
                      </span>
                      {c.nome}{c.cpf ? ` (${c.cpf})` : ""}
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
              disabled={!clienteId}
              onChange={(e) => {
                const v = e.target.value;
                setBuscaEndereco(v);
                setShowSugEndereco(true);
              }}
              onFocus={() => setShowSugEndereco(true)}
              required
            />
            {clienteId && showSugEndereco && enderecosFiltrados.length > 0 && (
              <div className="autocomplete-box">
                {enderecosFiltrados.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    className="autocomplete-item"
                    onMouseDown={() => {
                      setEnderecoId(String(e.id));
                      setBuscaEndereco(`${e.logradouro}${e.numero ? ", " + e.numero : ""}, ${e.bairro} — ${e.cidade}`);
                      setShowSugEndereco(false);
                    }}
                  >
                    <span style={{ display: "inline-flex", width: 20, marginRight: 6 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C8.686 2 6 4.686 6 8c0 5.25 6 12 6 12s6-6.75 6-12c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="var(--accent-pink)" />
                      </svg>
                    </span>
                    {e.logradouro}
                    {e.numero ? `, ${e.numero}` : ""}
                    , {e.bairro} — {e.cidade}
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
              placeholder="Ex: Ligar antes, portão azul, medir janela..."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />
          </div>

          <div className="mb-actions center">
            <button className="mb-btn-primary" type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>

            <button
              type="button"
              className="mb-btn-ghost"
              onClick={() => (window.location.href = "/medicoes")}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* helpers */
function formatToDateTimeLocal(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
