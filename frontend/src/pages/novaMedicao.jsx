import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "../styles/medicaoForm.css";

export default function AgendarMedicao() {
  const [clientes, setClientes] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
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
      if (termo.length < 2) {
        setClientes([]);
        return;
      }
      const res = await api.get(`/clientes/search/${termo}`);
      setClientes(res.data || []);
    } catch {
      setClientes([]);
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
      setErro("Não foi possível carregar os endereços do cliente selecionado.");
    }
  }

  function clienteLabel(c) {
    const tel = c.telefone ? ` — ${c.telefone}` : "";
    const cpf = c.cpf ? ` (${c.cpf})` : "";
    return `${c.nome}${tel}${cpf}`.trim();
  }

  // ✅ quando o texto bater com a sugestão, define clienteId e carrega endereços
  useEffect(() => {
    const texto = clienteBusca.trim();

    if (!texto) {
      setClienteId("");
      setEnderecos([]);
      setEnderecoId("");
      return;
    }

    const achou = clientes.find((c) => clienteLabel(c) === texto);

    if (achou) {
      setClienteId(String(achou.id));
      setEnderecoId("");
      setErro("");
      carregarEnderecos(achou.id);
    } else {
      setClienteId("");
      setEnderecos([]);
      setEnderecoId("");
    }
  }, [clienteBusca, clientes]);

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => String(c.id) === String(clienteId)),
    [clientes, clienteId]
  );

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

    if (!clienteId || !enderecoId || !dataAgendada) {
      setErro("Preencha cliente, endereço e data/hora.");
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
              list="clientes-list"
              placeholder="Digite nome, telefone ou CPF..."
              value={clienteBusca}
              onChange={(e) => {
                setErro("");
                setClienteBusca(e.target.value);
                buscarClientes(e.target.value);
              }}
              required
            />

            <datalist id="clientes-list">
              {clientes.map((c) => (
                <option key={c.id} value={clienteLabel(c)} />
              ))}
            </datalist>

            {clienteBusca.trim() && !clienteId && (
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

              {clienteId && enderecos.length === 0 && (
                <div className="mb-hint mb-warn">
                  Este cliente ainda não possui endereços cadastrados.
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
            <button className="mb-btn-primary" type="submit" disabled={loading}>
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
