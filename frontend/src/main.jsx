import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./styles/global.css";

import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Dashboard from "./pages/dashboard.jsx";
import Clientes from "./pages/clientes.jsx";
import ClienteNovo from "./pages/clienteNovo.jsx";
import ClienteEditar from "./pages/clienteEditar.jsx";
import Enderecos from "./pages/enderecos.jsx";
import Medicoes from "./pages/medicoes.jsx";
import EnderecosListar from "./pages/enderecosListar.jsx";
import EnderecoEditar from "./pages/enderecoEditar.jsx";
import ProtectedRoutes from "./componentes/ProtectedRoutes.jsx";
import EditarMedicao from "./pages/editarMedicao.jsx";
import MedicoesConcluidas from "./pages/medicoesConcluidas.jsx";
import AgendarMedicao from "./pages/agendarMedicao.jsx";
import NovaMedicao from "./pages/novaMedicao.jsx"
import Produtos from "./pages/produtos.jsx";
import ProdutoNovo from "./pages/produtoNovo.jsx";
import ProdutoEditar from "./pages/produtoEditar.jsx";
import EsqueciSenha from "./pages/esqueciSenha.jsx";
import ResetarSenha from "./pages/resetarSenha.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>

        {/* ROTAS PÚBLICAS */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha/>} />
        <Route path="/resetar-senha" element={<ResetarSenha />} />

        {/* ROTAS PROTEGIDAS */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<Dashboard />} />
           <Route path="/medicoes/editar/:id" element={<EditarMedicao />} />
           <Route path="/medicoes/concluidas" element={<MedicoesConcluidas />} />
           <Route path="/medicoes/nova" element={<NovaMedicao />} />
           <Route path="/medicoes/agendar" element={<AgendarMedicao />} /> 

          {/* CLIENTES */}
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<ClienteNovo />} />
          <Route path="/clientes/editar/:id" element={<ClienteEditar />} />

          {/* OUTRAS */}
          <Route path="/enderecos" element={<Enderecos />} />
          <Route path="/medicoes" element={<Medicoes />} />
          <Route path="/enderecos/listar" element={<EnderecosListar/>} />
          <Route path="/enderecos/editar/:id" element={<EnderecoEditar />} />


          <Route path="/produtos" element={<Produtos />} />
          <Route path="/produtos/novo" element={<ProdutoNovo />} />
          <Route path="/produtos/editar/:id" element={<ProdutoEditar />} />

        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
