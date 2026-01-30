import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/produtos.css";

export default function ProdutoEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  useEffect(() => {
    carregarProduto();
    // eslint-disable-next-line
  }, []);

  async function carregarProduto() {
    try {
      setErro("");
      setLoadingPage(true);

      const res = await api.get(`/produtos/${id}`);

      setNome(res.data?.nome || "");
      setDescricao(res.data?.descricao || "");
    } catch (err) {
      console.error(err);
      alert("Produto não encontrado.");
      navigate("/produtos");
    } finally {
      setLoadingPage(false);
    }
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome do produto é obrigatório.");
      return;
    }

    try {
      setLoading(true);

      await api.put(`/produtos/${id}`, {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
      });

      alert("Produto atualizado com sucesso!");
      navigate("/produtos");
    } catch (err) {
      console.error(err);
      setErro("Erro ao atualizar produto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-container">
      <div className="form-card prod-form-card">
        {/* HEADER */}
        <div className="form-header">
          <button
            type="button"
            className="btn-back"
            onClick={() => navigate("/produtos")}
            title="Voltar"
          >
            ←
          </button>

          <div>
            <h2 className="form-title">Editar Produto</h2>
            <div className="form-pill">
              Atualize o nome (e descrição opcional) do produto.
            </div>
          </div>
        </div>

        {/* ESTADOS */}
        {loadingPage && <p className="loading-text">Carregando produto...</p>}
        {erro && <div className="alert-error">{erro}</div>}

        {/* FORM */}
        {!loadingPage && (
          <form onSubmit={salvar}>
            <div className="field">
              <label>Nome do Produto</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Box de Vidro"
                required
              />
            </div>

            <div className="field">
              <label>Descrição (opcional)</label>
              <input
                type="text"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Vidro temperado 8mm"
              />
            </div>

            <div className="form-actions">
              <button className="btn-primary" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Alterações"}
              </button>

              <button
                type="button"
                className="btn-ghost"
                onClick={carregarProduto}
                disabled={loading}
              >
                Recarregar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}