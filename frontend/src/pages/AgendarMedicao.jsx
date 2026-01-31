import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "../styles/medicaoForm.css";

export default function AgendarMedicao() {
  const [clientes, setClientes] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecosLoading, setEnderecosLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [enderecoId, setEnderecoId] = useState("");
  const [produtoId, setProdutoId] = useState("");

  const [dataAgendada, setDataAgendada] = useState("");
  const [descricao, setDescricao] = useState("");

  const [buscaCliente, setBuscaCliente] = useState("");
  const [showSugestoes, setShowSugestoes] = useState(false);
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

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (!clienteId || !enderecoId || !dataAgendada) {
      return setErro("Cliente, endereço e data/hora são obrigatórios.");
    }

    try {
      setLoading(true);
      await api.post("/medicoes", {
        clienteId: Number(clienteId),
        enderecoId: Number(enderecoId),
        produtoId: produtoId ? Number(produtoId) : undefined,
        dataAgendada,
        descricao,
      });

      alert("Medição agendada com sucesso!");
      window.location.href = "/medicoes";
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
    <div className="form-container">
      <div className="form-card pro">
        {/* HEADER */}
        <div className="form-header">
          <div>
            <h2>Agendar Medição</h2>
            <p className="form-subtitle">
              Selecione o cliente, o endereço e defina a data/hora da visita.
            </p>
          </div>

          <div className="form-header-actions">
            <Link to="/medicoes" className="btn-ghost">
              Voltar
            </Link>
          </div>
        </div>

        {erro && <div className="alert-error">{erro}</div>}

        <form onSubmit={salvar}>
          {/* BUSCAR CLIENTE */}
          <div className="field">
            <label>Buscar cliente</label>
            <input
              className="search-input"
              placeholder="Digite nome, telefone ou CPF..."
              value={buscaCliente}
              onChange={(e) => {
                const v = e.target.value;
                setBuscaCliente(v);
                buscarClientes(v);
              }}
              onFocus={() => {
                if (buscaCliente.trim().length > 0 && clientes.length > 0) {
                  setShowSugestoes(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSugestoes(false), 120);
              }}
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
                    <span style={{ marginRight: 8 }}>👤</span>
                    <span>{c.nome}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GRID */}
          <div className="form-grid">
            {/* CLIENTE */}
            <div className="field">
              <label>Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => {
                  const novoClienteId = e.target.value;
                  setClienteId(novoClienteId);
                  setEnderecoId("");
                  setEnderecos([]);
                  setErro("");
                  if (novoClienteId) carregarEnderecos(novoClienteId);
                }}
                required
              >
                <option value="">Selecione um cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.telefone}
                  </option>
                ))}
              </select>

              {clienteSelecionado && (
                <div className="helper">
                  Cliente selecionado: <strong>{clienteSelecionado.nome}</strong>
                </div>
              )}
            </div>

            {/* ENDEREÇO */}
            <div className="field">
              <div className="label-row">
                <label>Endereço</label>
                {clienteId && (
                  <Link
                    to="/enderecos"
                    className="link-action"
                    title="Cadastrar/gerenciar endereços"
                  >
                    + Cadastrar endereço
                  </Link>
                )}
              </div>

              <select
                value={enderecoId}
                onChange={(e) => setEnderecoId(e.target.value)}
                required
                disabled={!clienteId}
              >
                <option value="">
                  {!clienteId ? "Selecione um cliente primeiro..." : "Selecione..."}
                </option>

                {enderecos.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.logradouro}, {e.bairro} — {e.cidade} ({e.cep})
                  </option>
                ))}
              </select>

              {clienteId && !enderecosLoading && enderecos.length === 0 && (
                <div className="helper warn">
                  Este cliente não possui endereços cadastrados. Por favor, cadastre um endereço antes de prosseguir com o agendamento.
                </div>
              )}
            </div>
          </div>

          <div className="form-grid">
            {/* PRODUTO */}
            <div className="field">
              <label>Produto (opcional)</label>
              <select
                value={produtoId}
                onChange={(e) => setProdutoId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {produtos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* DATA */}
            <div className="field">
              <label>Data & Hora</label>
              <input
                type="datetime-local"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                required
              />
              <div className="helper">
                Dica: agende com antecedência para evitar conflitos.
              </div>
            </div>
          </div>

          {/* OBS */}
          <div className="field">
            <label>Observação</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Ligar para o cliente antes • Janela da cozinha • Vidro fumê"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="form-actions">
            <button
              className="btn-primary"
              type="submit"
              disabled={
                loading ||
                (clienteId && !enderecosLoading && enderecos.length === 0) ||
                enderecosLoading
              }
            >
              {loading ? "Agendando..." : "Agendar Medição"}
            </button>

            <Link to="/medicoes" className="btn-secondary">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
