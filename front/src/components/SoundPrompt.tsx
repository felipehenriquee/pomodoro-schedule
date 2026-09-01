import { useTranslation } from "react-i18next";

type Props = {
  open: boolean;
  onActivate: () => void;
  onDismiss: () => void;
};

export function SoundPrompt({ open, onActivate, onDismiss }: Props) {
  const { t } = useTranslation();

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t("soundPrompt.title")}</h3>
        <p>{t("soundPrompt.body")}</p>
        <div className="modal-actions">
          <button className="chip" onClick={onDismiss}>
            {t("soundPrompt.dismiss")}
          </button>
          <button className="chip solid" onClick={onActivate}>
            {t("soundPrompt.activate")}
          </button>
        </div>
      </div>
    </div>
  );
}
