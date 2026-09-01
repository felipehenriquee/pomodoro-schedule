import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export type ModalSize = "sm" | "md";

type Props = {
  /** Defaults to true, for modals that are only mounted while open. */
  open?: boolean;
  title: ReactNode;
  onClose: () => void;
  /** "sm" ~360px (default) | "md" ~460px, scrollable */
  size?: ModalSize;
  /** Modal body -- rendered below the header (the "slot"). */
  children: ReactNode;
};

/**
 * Generic modal: dimmed overlay (click to close), a header with the title and
 * a ✕ button, and a body slot for whatever the caller passes as children.
 */
export function Modal({
  open = true,
  title,
  onClose,
  size = "sm",
  children,
}: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={size === "md" ? "modal modal-form" : "modal"}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button
            className="modal-close"
            onClick={onClose}
            title={t("common.close")}
          >
            {"✕"}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
