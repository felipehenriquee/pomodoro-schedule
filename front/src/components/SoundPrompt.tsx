type Props = {
  open: boolean;
  onActivate: () => void;
  onDismiss: () => void;
};

export function SoundPrompt({ open, onActivate, onDismiss }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Um novo evento começou</h3>
        <p>O som do alarme está desativado. Quer ativar agora?</p>
        <div className="modal-actions">
          <button className="chip" onClick={onDismiss}>
            agora não
          </button>
          <button className="chip solid" onClick={onActivate}>
            ativar som
          </button>
        </div>
      </div>
    </div>
  );
}
