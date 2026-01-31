import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "../styles/medicaoForm.css";

export default function AgendarMedicao() {
  const [clientes, setClientes] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecosLoading, setEnderecosLoading] = useState(false);
  const [produtos, setProdutos] = useState([]);

  // ✅ Campo único com autocomplete
  const [clienteBusca, setClienteBusca] = useState("");
  const [clienteId, setClienteId] = useState("");

  const [enderecoId, setEnderecoId] = useState("");
  const [produtoId, setProdutoId] = useState("");
  const [dataAgendada, setDataAgendada] = useState("");
  const [observacao, setObservacao] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSugestoes, setShowSugestoes] = useState(false);
  const [tentouSalvar, setTentouSalvar] = useState(false);

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
    } catch {
      setClientes([]);
      setShowSugestoes(false);
    }
  }

  async function carregarEnderecos(clienteIdSelecionado) {
    try {
      if (!clienteIdSelecionado) {
        setEnderecos([]);
        return;
      }
      setEnderecosLoading(true);
      const res = await api.get(`/enderecos/cliente/${clienteIdSelecionado}`);
      setEnderecos(res.data || []);
    } catch {
      setEnderecos([]);
      setErro("Não foi possível carregar os endereços do cliente selecionado.");
    } finally {
      setEnderecosLoading(false);
    }
  }

 

  useEffect(() => {
    const texto = clienteBusca.trim();
    if (!texto) {
      setClienteId("");
      setEnderecos([]);
      setEnderecoId("");
      setShowSugestoes(false);
      return;
    }
  }, [clienteBusca]);

  const clienteSelecionado = useMemo(() => {
    if (!clienteId) return null;
    const found = clientes.find((c) => String(c.id) === String(clienteId));
    return found || { id: clienteId, nome: clienteBusca };
  }, [clientes, clienteId, clienteBusca]);

  useEffect(() => {
    const texto = clienteBusca.trim();
    if (clienteSelecionado && clienteSelecionado.nome !== texto) {
      setClienteId("");
      setEnderecos([]);
      setEnderecoId("");
    }
  }, [clienteBusca, clienteSelecionado]);
  function selecionarCliente(id, nome) {
    setClienteId(String(id));
    setClienteBusca(nome);
    setEnderecoId("");
    setEnderecos([]);
    setErro("");
    carregarEnderecos(id);
    setClientes([]);
    setShowSugestoes(false);
  }

  function limparFormulario() {
    setClienteBusca("");
    setClienteId("");
    setEnderecos([]);
    setEnderecoId("");
    setProdutoId("");
    setDataAgendada("");
    setObservacao("");
    setErro("");
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    setTentouSalvar(true);

    if (!clienteId || !enderecoId || !dataAgendada) {
      setErro("Preencha cliente, endereço e data/hora.");
      return;
    }

    if (clienteId && enderecos.length === 0) {
      setErro(
        "Este cliente não possui endereços cadastrados. Por favor, cadastre um endereço antes de prosseguir com o agendamento."
      );
      return;
    }

    try {
      setLoading(true);

      await api.post("/medicoes", {
        clienteId: Number(clienteId),
        enderecoId: Number(enderecoId),
        produtoId: produtoId ? Number(produtoId) : null,
        dataAgendada,
        descricao: observacao,
      });

      alert("Medição agendada com sucesso!");
      window.location.href = "/medicoes";
    } catch (err) {
      setErro(
        err.response?.data?.message ||
          err.response?.data?.erro ||
          "Não foi possível agendar a medição."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    // ✅ IMPORTANTE: não use page-container aqui (o layout já tem)
    <div className="mb-page">
      {/* HEADER no padrão */}
      <div className="mb-header">
        <div>
          <h2 className="page-title mb-title">Agendar Medição</h2>

          {/* ✅ balão azul */}
          <div className="mb-pill">
            Selecione o cliente, o endereço e defina a data/hora da visita.
          </div>
        </div>

        {/* ✅ seta no lugar do “Voltar” */}
        <button
          type="button"
          className="mb-back"
          title="Voltar"
          onClick={() => (window.location.href = "/medicoes")}
        >
          ←
        </button>
      </div>

      {/* CARDS (padrão Medições Concluídas) */}
      <div className="mb-cards">
        <div className="mb-card">
          <div className="mb-card-label">Cliente selecionado</div>
          <div className="mb-card-value">
            {clienteSelecionado ? clienteSelecionado.nome : "—"}
          </div>
          <div className="mb-card-sub">
            {clienteSelecionado
              ? "Selecione o endereço abaixo"
              : "Escolha um cliente para continuar"}
          </div>
        </div>

        <div className="mb-card">
          <div className="mb-card-label">Endereços disponíveis</div>
          <div className="mb-card-value">{clienteId ? enderecos.length : "—"}</div>
          <div className="mb-card-sub">
            {clienteId ? "Carregados para este cliente" : "Selecione um cliente"}
          </div>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="mb-form-card">
        {erro && <div className="mb-alert">{erro}</div>}

        <form onSubmit={salvar}>
          <div className="mb-field">
            <label>Cliente</label>

            <input
              className="mb-input"
              placeholder="Digite nome, telefone ou CPF..."
              value={clienteBusca}
              onChange={(e) => {
                setErro("");
                setClienteBusca(e.target.value);
                buscarClientes(e.target.value);
              }}
              onFocus={() => {
                if (clienteBusca.trim().length > 0 && clientes.length > 0) {
                  setShowSugestoes(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSugestoes(false), 120);
              }}
              required
            />

            {showSugestoes && clienteBusca.trim() && clientes.length > 0 && (
              <div className="autocomplete-box">
                {clientes.slice(0, 6).map((c) => (
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

            {tentouSalvar && !clienteId && (
              <div className="mb-hint mb-warn">
                Selecione um cliente válido na lista de sugestões.
              </div>
            )}
          </div>

          <div className="mb-grid">
            <div className="mb-field">
              <label>Endereço</label>
              <select
                className="mb-input"
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
                    {e.logradouro}, {e.bairro} — {e.cidade}
                  </option>
                ))}
              </select>

              {clienteId && !enderecosLoading && enderecos.length === 0 && (
                <div className="mb-hint mb-warn">
                  Este cliente não possui endereços cadastrados. Por favor, cadastre um endereço antes de prosseguir com o agendamento.
                </div>
              )}
            </div>

            <div className="mb-field">
              <label>Produto (opcional)</label>
              <select
                className="mb-input"
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

            <div className="mb-field">
              <label>Data & Hora</label>
              <input
                className="mb-input"
                type="datetime-local"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                required
              />
              <div className="mb-hint">
                Dica: agende com antecedência para evitar conflitos.
              </div>
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

          <div className="mb-actions">
            <button
              className="mb-btn-primary"
              type="submit"
              disabled={
                loading ||
                (clienteId && !enderecosLoading && enderecos.length === 0) ||
                enderecosLoading
              }
            >
              {loading ? "Salvando..." : "Agendar Medição"}
            </button>

            <button
              type="button"
              className="mb-btn-ghost"
              onClick={limparFormulario}
              disabled={loading}
            >
              Limpar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
