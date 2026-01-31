
import { NavLink, useLocation } from "react-router-dom";
import logoMedobras from "../assets/icons/logoMedobras.jpeg";
import "../styles/layout.css";

export default function Sidebar() {
  const location = useLocation();
  const path = location.pathname;
  const isMedicoesConcluidas = path.startsWith("/medicoes/concluidas");
  const isMedicoesSection =
    path.startsWith("/medicoes") && !isMedicoesConcluidas;
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logoMedobras} alt="MedObras" className="logo-img" />
        <div className="logo-text">
          <strong>MedObras</strong>
          <span>Sistema de Medições</span>
        </div>
      </div>

      <nav className="sidebar-menu">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            "sidebar-item" + (isActive ? " active" : "")
          }
        >
          <span>🏠</span>
          <span>Início</span>
        </NavLink>

        <NavLink
          to="/clientes"
          className={({ isActive }) =>
            "sidebar-item" + (isActive ? " active" : "")
          }
        >
          <span>👤</span>
          <span>Clientes</span>
        </NavLink>

        <NavLink
          to="/enderecos"
          className={({ isActive }) =>
            "sidebar-item" + (isActive ? " active" : "")
          }
        >
          <span>📍</span>
          <span>Endereços</span>
        </NavLink>

        <NavLink
          to="/medicoes"
          className={() => "sidebar-item" + (isMedicoesSection ? " active" : "")}
        >
          <span>📏</span>
          <span>Agendar Medições</span>
        </NavLink>

        {/* 🔵 NOVA OPÇÃO: Medições Concluídas */}
        <NavLink
          to="/medicoes/concluidas"
          className={() =>
            "sidebar-item" + (isMedicoesConcluidas ? " active" : "")
          }
        >
          <span>📘</span>
          <span>Medições Concluídas</span>
        </NavLink>
        <NavLink
  to="/produtos"
  className={({ isActive }) =>
    "sidebar-item" + (isActive ? " active" : "")
  }
>
  <span>📦</span>
  <span>Produtos</span>
</NavLink>

      </nav>
    </aside>
  );
}
