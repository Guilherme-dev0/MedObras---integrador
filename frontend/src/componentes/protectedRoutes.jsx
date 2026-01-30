import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";  // AGORA ESTÁ CERTO
import "../styles/layout.css";

export default function ProtectedRoutes() {
  const token = localStorage.getItem("token");
  const empresaNome = localStorage.getItem("empresaNome") || "Empresa";
  const empresaEmail = localStorage.getItem("empresaEmail") || "";
  const location = useLocation();
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  function handleLogout() {
    localStorage.removeItem("token");
    navigate("/");
  }

  return (
    <div className="layout">
      <Sidebar />

      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">Dashboard</h1>
          </div>

          <div className="topbar-right">
            <div className="status-pill">● Sistema Online</div>

            <div className="user-info">
              <div className="avatar">{empresaNome.charAt(0).toUpperCase()}</div>
              <div>
                <div className="user-name">{empresaNome}</div>
                <div className="user-email">{empresaEmail}</div>
              </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </header>

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}