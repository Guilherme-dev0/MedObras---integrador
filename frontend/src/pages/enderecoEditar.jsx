import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/clienteForm.css";
import Swal from 'sweetalert2';

export default function EnderecoEditar() {
  const { id } = useParams();

  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [cep, setCep] = useState("");
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    try {
      const res = await api.get("/enderecos");
      const endereco = (res.data || []).find((e) => e.id == id);
      if (!endereco) return Swal.fire({ icon: 'error', title: 'Erro', text: 'Endereço não encontrado.' });

      setLogradouro(endereco.logradouro || "");
      setNumero(endereco.numero || "");
      setBairro(endereco.bairro || "");
      setCidade(endereco.cidade || "");
      setCep(endereco.cep || "");
    } catch (err) {
      console.error("Erro ao carregar endereço:", err);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function validarCep(valor) {
    const apenasNumeros = String(valor).replace(/\D/g, "");
    return apenasNumeros.length === 8;
  }

  async function salvar(e) {
    e.preventDefault();
    if (!validarCep(cep)) {
      setErro("CEP inválido. Use 8 dígitos.");
      return;
    }

    try {
      await api.put(`/enderecos/${id}`, {
        logradouro,
        numero: numero || undefined,
        bairro,
        cidade,
        cep: String(cep).replace(/\D/g, ""),
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
        title: 'Endereço atualizado com sucesso!'
      });
      
      setTimeout(() => {
        window.location.href = "/enderecos/listar";
      }, 1000);
    } catch (err) {
      console.error(err);
      setErro("Erro ao atualizar endereço.");
    }
  }

  return (
    <div className="cliente-container">
      <div className="cliente-card">
        <h2>Editar Endereço</h2>

        {erro && <p className="erro-msg">{erro}</p>}

        <form onSubmit={salvar}>
          <div className="linha">
            <div className="campo">
              <label>Logradouro</label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label>Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
              />
            </div>
            <div className="campo">
              <label>Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="linha">
            <div className="campo">
              <label>Cidade</label>
              <input
                type="text"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                required
              />
            </div>
            <div className="campo">
              <label>CEP</label>
              <input
                type="text"
                maxLength="9"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  const formatado =
                    v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5, 8)}` : v;
                  setCep(formatado);
                  setErro("");
                }}
                required
              />
            </div>
          </div>

          <button className="btn-salvar">Salvar</button>
        </form>
      </div>
    </div>
  );
}
