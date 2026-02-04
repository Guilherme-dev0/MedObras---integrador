import { useEffect, useMemo, useState } from "react";
import api from "../api";
import "../styles/dashboard.css";

export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [medicoes, setMedicoes] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setErro("");
        const [c, m] = await Promise.all([api.get("/clientes"), api.get("/medicoes")]);
        setClientes(c.data || []);
        setMedicoes(m.data || []);
      } catch (err) {
        console.error("Erro ao carregar dashboard:", err);
        const status = err?.response?.status;
        const msg =
          status === 401 || status === 403
            ? "Sessão expirada ou não autenticada. Faça login novamente."
            : status
            ? `Falha ao carregar (${status}).`
            : "Falha de rede ao carregar o dashboard.";
        setErro(msg);
      }
    }
    carregar();
  }, []);

  // Normaliza status para evitar erro com acento/dados antigos
  function normalizarStatus(status) {
    const s = (status || "").toLowerCase().trim();
    if (s === "pendente") return "pendente";
    if (s === "concluída" || s === "concluida" || s === "concluido") return "concluida";
    return s;
  }

  const totalClientes = clientes.length;

  const totalMedicoes = medicoes.length;

  const pendentes = useMemo(() => {
    return medicoes.filter((m) => normalizarStatus(m.status) === "pendente").length;
  }, [medicoes]);

  const concluidas = useMemo(() => {
    return medicoes.filter((m) => normalizarStatus(m.status) === "concluida").length;
  }, [medicoes]);

  const recentes = useMemo(() => {
    return [...medicoes]
      .sort(
        (a, b) =>
          new Date(b.dataAgendada || b.createdAt) - new Date(a.dataAgendada || a.createdAt)
      )
      .slice(0, 3);
  }, [medicoes]);

  function textoStatus(status) {
    const s = normalizarStatus(status);
    if (s === "pendente") return "Pendente";
    if (s === "concluida") return "Concluída";
    return status || "-";
  }

  function classeBadge(status) {
    const s = normalizarStatus(status);
    if (s === "pendente") return "warning";
    if (s === "concluida") return "success";
    return "";
  }

  // Helper para exibir observação limpa (sem JSON) e com prioridade
  function formatarObservacao(medicao) {
    const texto = medicao.observacao || medicao.descricao || "";
    
    // Tenta detectar se é um JSON
    if (texto.trim().startsWith("{") && texto.includes("obs")) {
      try {
        const parsed = JSON.parse(texto);
        return parsed.obs || "Sem observação";
      } catch (e) {
        // Se falhar o parse, retorna o texto original limpo
        return texto;
      }
    }
    
    return texto || "Medição sem descrição";
  }

  return (
    <div className="dash-container">
      <h2 className="dash-title">Início</h2>
      <p className="dash-subtitle">
        Gerencie suas medições de canteiro de obras com eficiência e precisão.
      </p>

      {erro && <p className="erro-msg">{erro}</p>}

      {/* cards principais */}
      <div className="dash-cards">
        <div className="dash-card primary">
          <div>
            <span className="dash-card-label">Clientes</span>
            <div className="dash-card-number">{totalClientes}</div>
            <span className="dash-card-foot">Cadastrados no sistema</span>
          </div>
        </div>

        <div className="dash-card">
          <span className="dash-card-label">Medições Pendentes</span>
          <div className="dash-card-number">{pendentes}</div>
          <span className="dash-card-foot">Em andamento</span>
        </div>

        <div className="dash-card">
          <span className="dash-card-label">Medições Concluídas</span>
          <div className="dash-card-number">{concluidas}</div>
          <span className="dash-card-foot">Finalizadas</span>
        </div>

        <div className="dash-card">
          <span className="dash-card-label">Total de Medições</span>
          <div className="dash-card-number">{totalMedicoes}</div>
          <span className="dash-card-foot">Registradas no sistema</span>
        </div>
      </div>

      <div className="dash-grid">
        {/* Atalhos rápidos */}
        <section className="dash-panel">
          <div className="dash-panel-header">
            <h3>Atalhos Rápidos</h3>
          </div>

          <div className="shortcut-list">
            <button
              className="shortcut-item primary"
              onClick={() => (window.location.href = "/medicoes/nova")}
              type="button"
            >
              <div className="shortcut-icon">＋</div>
              <div>
                <div className="shortcut-title">Nova Medição</div>
                <div className="shortcut-text">Agendar uma nova medição</div>
              </div>
            </button>

            <button
              className="shortcut-item"
              onClick={() => (window.location.href = "/clientes/novo")}
              type="button"
            >
              <div className="shortcut-icon">👤</div>
              <div>
                <div className="shortcut-title">Cadastrar Cliente</div>
                <div className="shortcut-text">Adicionar um novo cliente</div>
              </div>
            </button>

            <button
              className="shortcut-item"
              onClick={() => (window.location.href = "/enderecos")}
              type="button"
            >
              <div className="shortcut-icon">📍</div>
              <div>
                <div className="shortcut-title">Gerenciar Endereços</div>
                <div className="shortcut-text">Visualizar e atualizar endereços</div>
              </div>
            </button>
          </div>
        </section>

        {/* Medições recentes */}
        <section className="dash-panel">
          <div className="dash-panel-header">
            <h3>Medições Recentes</h3>
          </div>

          <div className="recent-list">
            {recentes.length === 0 && (
              <p className="empty-text">Nenhuma medição cadastrada ainda.</p>
            )}

            {recentes.map((m) => (
              <div key={m.id} className="recent-item">
                <div className="recent-info">
                  <div className="recent-title">
                    {formatarObservacao(m)}
                  </div>
                  <div className="recent-sub">Cliente: {m.cliente?.nome || "-"}</div>
                </div>

                <div className="recent-right">
                  <span className={"badge " + classeBadge(m.status)}>
                    {textoStatus(m.status)}
                  </span>

                  <div className="recent-date">
                    {m.dataAgendada
                      ? new Date(m.dataAgendada).toLocaleDateString("pt-BR")
                      : "-"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}