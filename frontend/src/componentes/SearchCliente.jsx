import { useState } from "react";
import api from "../api";

export default function SearchCliente({ onSelect }) {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState([]);

  async function handleSearch(e) {
    const valor = e.target.value;
    setBusca(valor);

    if (valor.length < 2) return;

    const res = await api.get(`/clientes/search/${valor}`);
    setResultados(res.data);
  }

  return (
    <div className="search-box">
      <input
        type="text"
        placeholder="Buscar cliente pelo nome..."
        value={busca}
        onChange={handleSearch}
      />

      {resultados.length > 0 && (
        <div className="search-results">
          {resultados.map((c) => (
            <div
              key={c.id}
              className="search-item"
              onClick={() => {
                onSelect(c);
                setResultados([]);
                setBusca(c.nome);
              }}
            >
              {c.nome}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}