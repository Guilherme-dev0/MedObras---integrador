import { useEffect, useRef, useState, useCallback } from "react";

export default function ConfirmModal({
  titulo,
  mensagem,
  textoConfirmar = "Confirmar",
  funcaoConfirmar,
  isOpen,
  onClose,
}) {
  const confirmBtnRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const btn = confirmBtnRef.current;
    if (btn) btn.focus();

    function handleKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (!loading) onClose?.();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!loading) onConfirm();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, loading, onClose, onConfirm]);

  const onConfirm = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.resolve(funcaoConfirmar?.());
      onClose?.();
    } finally {
      setLoading(false);
    }
  }, [funcaoConfirmar, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h3 className="modal-title">{titulo}</h3>
        {mensagem && <p className="modal-message">{mensagem}</p>}

        <div className="modal-actions">
          <button
            ref={confirmBtnRef}
            className={`btn-confirm ${loading ? "btn-loading" : ""}`}
            onClick={onConfirm}
          >
            {loading ? (
              <span className="btn-inline">
                <span className="btn-inline-spinner" /> {textoConfirmar}
              </span>
            ) : (
              textoConfirmar
            )}
          </button>

          <button className="btn-outline" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
