import { useState } from "react";
import api from "../api";
import "../styles/produtos.css";

export default function ProdutoNovo() {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorM2, setValorM2] = useState("");

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) return setErro("O nome é obrigatório.");

    try {
      setLoading(true);

      const payload = { nome: nome.trim() };

      // ✅ só envia se você preencher
      if (descricao.trim()) payload.descricao = descricao.trim();
      if (valorM2 !== "" && Number(valorM2) >= 0) payload.valorM2 = Number(valorM2);

      await api.post("/produtos", payload);

      alert("Produto cadastrado!");
      window.location.href = "/produtos";
    } catch (err) {
      console.error(err);
      setErro("Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-container">
      <div className="form-card prod-form-card">
        <div className="form-header">
          <button
            type="button"
            className="btn-back"
            onClick={() => (window.location.href = "/produtos")}
            title="Voltar"
          >
            ←
          </button>

          <div>
            <h2 className="form-title">Novo Produto</h2>
            <div className="form-pill">
              Informe o nome e, se quiser, o valor por m² e a descrição.
            </div>
          </div>
        </div>

        {erro && <div className="alert-error">{erro}</div>}

        <form onSubmit={salvar}>
          <div className="field">
            <label>Nome do Produto</label>
            <input
              type="text"
              placeholder="Ex: Box de Vidro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label>Valor por m² (opcional)</label>
              <input
                type="number"
                placeholder="Ex: 120.00"
                value={valorM2}
                onChange={(e) => setValorM2(e.target.value)}
                min="0"
                step="0.01"
              />
              <div className="hint">
                Preview: <strong>R$ {Number(valorM2 || 0).toFixed(2)}/m²</strong>
              </div>
            </div>

            <div className="field">
              <label>Descrição (opcional)</label>
              <input
                type="text"
                placeholder="Ex: Vidro temperado 8mm"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-primary" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setNome("");
                setDescricao("");
                setValorM2("");
                setErro("");
              }}
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