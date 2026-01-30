import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/medicaoForm.css";

export default function EditarMedicao() {
  const { id } = useParams();

  const [clientes, setClientes] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [produtos, setProdutos] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [enderecoId, setEnderecoId] = useState("");

  // ✅ suporta 1 produto OU vários
  const [produtoId, setProdutoId] = useState(""); // modo simples
  const [produtoIds, setProdutoIds] = useState([]); // modo múltiplo

  const [dataAgendada, setDataAgendada] = useState("");
  const [observacao, setObservacao] = useState("");

  // ✅ novos campos: altura e largura
  const [altura, setAltura] = useState("");
  const [largura, setLargura] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [modoMultiplo, setModoMultiplo] = useState(false);

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // carrega endereços do cliente
      if (cid) {
        const resEnd = await api.get(`/enderecos/cliente/${cid}`);
        setEnderecos(resEnd.data || []);
      } else {
        setEnderecos([]);
      }

      setEnderecoId(String(med.enderecoId || ""));

      // data/obs
      setDataAgendada(formatToDateTimeLocal(med.dataAgendada || med.data || ""));
      setObservacao(med.descricao || med.observacao || "");

      // altura/largura (se existir no backend)
      setAltura(med.altura != null ? String(med.altura) : "");
      setLargura(med.largura != null ? String(med.largura) : "");

      // ✅ condição: se existir array de produtos, ativa modo múltiplo
      if (Array.isArray(med.produtos) && med.produtos.length > 0) {
        setModoMultiplo(true);
        // tenta pegar ids em formatos diferentes
        const ids = med.produtos
          .map((p) => p.produtoId ?? p.id ?? p?.produto?.id)
          .filter(Boolean)
          .map(String);
        setProdutoIds(ids);
      } else {
        setModoMultiplo(false);
        setProdutoId(String(med.produtoId || ""));
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

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (!clienteId || !enderecoId || !dataAgendada) {
      setErro("Preencha cliente, endereço e data/hora.");
      return;
    }

    // valida altura/largura se preenchido
    const alturaNum = altura === "" ? null : Number(String(altura).replace(",", "."));
    const larguraNum = largura === "" ? null : Number(String(largura).replace(",", "."));
    if (alturaNum != null && (isNaN(alturaNum) || alturaNum <= 0)) {
      setErro("Altura inválida.");
      return;
    }
    if (larguraNum != null && (isNaN(larguraNum) || larguraNum <= 0)) {
      setErro("Largura inválida.");
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
        altura: alturaNum,
        largura: larguraNum,
      };

      // ✅ se múltiplo, envia lista; se simples, envia produtoId
      if (modoMultiplo) {
        payload.produtoIds = produtoIds.map(Number); // backend precisa aceitar isso
      } else {
        payload.produtoId = produtoId ? Number(produtoId) : null;
      }

      await api.put(`/medicoes/${id}`, payload);

      alert("Medição atualizada com sucesso!");
      window.location.href = "/medicoes";
    } catch (err) {
      console.log(err);
      setErro(
        err.response?.data?.message ||
          err.response?.data?.erro ||
          "Não foi possível salvar as alterações."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleProdutoMultiplo(idProduto) {
    setProdutoIds((prev) => {
      const idStr = String(idProduto);
      if (prev.includes(idStr)) return prev.filter((x) => x !== idStr);
      return [...prev, idStr];
    });
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

      {/* CARDS RESUMO */}
      <div className="mb-cards">
        <div className="mb-card">
          <div className="mb-card-label">Cliente</div>
          <div className="mb-card-value">
            {clienteSelecionado ? clienteSelecionado.nome : "—"}
          </div>
          <div className="mb-card-sub">
            {modoMultiplo ? "Modo múltiplos produtos" : "Modo produto único"}
          </div>
        </div>

        <div className="mb-card">
          <div className="mb-card-label">Área estimada</div>
          <div className="mb-card-value">
            {calcArea(altura, largura) ? `${calcArea(altura, largura)} m²` : "—"}
          </div>
          <div className="mb-card-sub">Baseado em altura × largura</div>
        </div>
      </div>

      {/* FORM */}
      <div className="mb-form-card">
        {erro && <div className="mb-alert">{erro}</div>}

        <form onSubmit={salvar}>
          <div className="mb-grid">
            <div className="mb-field">
              <label>Cliente</label>
              <select
                className="mb-input"
                value={clienteId}
                onChange={(e) => {
                  const novo = e.target.value;
                  setClienteId(novo);
                  setEnderecoId("");
                  carregarEnderecos(novo);
                }}
                required
              >
                <option value="">Selecione...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                    {c.cpf ? ` (${c.cpf})` : ""}
                  </option>
                ))}
              </select>
            </div>

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
            </div>

            {/* ✅ PRODUTOS */}
            {!modoMultiplo ? (
              <div className="mb-field">
                <label>Produto</label>
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

                {/* botão opcional pra testar modo múltiplo */}
                <button
                  type="button"
                  className="mb-mini"
                  onClick={() => {
                    setModoMultiplo(true);
                    setProdutoIds(produtoId ? [String(produtoId)] : []);
                    setProdutoId("");
                  }}
                >
                  Tenho mais de um produto
                </button>
              </div>
            ) : (
              <div className="mb-field">
                <label>Produtos agendados (selecione 1 ou mais)</label>
                <div className="mb-multi">
                  {produtos.map((p) => {
                    const checked = produtoIds.includes(String(p.id));
                    return (
                      <label key={p.id} className={`mb-check ${checked ? "is-on" : ""}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProdutoMultiplo(p.id)}
                        />
                        <span>{p.nome}</span>
                      </label>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="mb-mini"
                  onClick={() => {
                    setModoMultiplo(false);
                    setProdutoId(produtoIds[0] || "");
                    setProdutoIds([]);
                  }}
                >
                  Voltar para produto único
                </button>
              </div>
            )}

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

            {/* ✅ ALTURA / LARGURA */}
            <div className="mb-field">
              <label>Altura (m)</label>
              <input
                className="mb-input"
                type="text"
                placeholder="Ex: 1.50"
                value={altura}
                onChange={(e) => setAltura(e.target.value)}
              />
            </div>

            <div className="mb-field">
              <label>Largura (m)</label>
              <input
                className="mb-input"
                type="text"
                placeholder="Ex: 2.00"
                value={largura}
                onChange={(e) => setLargura(e.target.value)}
              />
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

function calcArea(altura, largura) {
  const a = Number(String(altura || "").replace(",", "."));
  const l = Number(String(largura || "").replace(",", "."));
  if (!a || !l || isNaN(a) || isNaN(l)) return "";
  return (a * l).toFixed(2);
}
