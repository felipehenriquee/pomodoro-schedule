import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../Icon";
import { LanguageToggle } from "../../i18n/LanguageToggle";

type Props = {
  onClearCancelled: () => void;
};

/** The "⋮" dropdown: clear cancelled events + language toggle. */
export function MoreOptionsMenu({ onClearCancelled }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="header-menu-wrap">
      <button
        className="row-ico"
        title={t("agenda.menu.more")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="more_vert" size={18} />
      </button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="header-menu">
            <button
              className="header-menu-item"
              onClick={() => {
                setOpen(false);
                onClearCancelled();
              }}
            >
              <Icon name="delete" size={16} />
              {t("agenda.menu.clearCancelled")}
            </button>
            <LanguageToggle onChange={() => setOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}
