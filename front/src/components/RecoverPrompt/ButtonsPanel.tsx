import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../Icon";

type Props = {
  onClose: () => void;
  onDoNow: () => void;
  onEndOfDay: () => void;
  onClear: () => void;
  onPick: () => void; // switch to the date picker
};

/** Default branch: agora não / fazer agora + the "more options" menu. */
export function ButtonsPanel({
  onClose,
  onDoNow,
  onEndOfDay,
  onClear,
  onPick,
}: Props) {
  const { t } = useTranslation();
  const [more, setMore] = useState(false);

  return (
    <div className="recover-panel from-left">
      <div className="modal-actions">
        <button className="chip" onClick={onClose}>
          {t("recover.notNow")}
        </button>
        <button className="chip solid" onClick={onDoNow}>
          {t("recover.doNow")}
        </button>
        <button
          className="row-ico"
          title={t("recover.moreOptions")}
          aria-expanded={more}
          onClick={() => setMore((m) => !m)}
        >
          <Icon name="more_vert" size={18} />
        </button>
      </div>

      <div className={`recover-more ${more ? "open" : ""}`}>
        <div className="recover-more-inner">
          <button className="chip" onClick={onEndOfDay}>
            {t("recover.endOfDay")}
          </button>
          <button className="chip" onClick={onPick}>
            {t("recover.pickDate")}
          </button>
          <button className="chip" onClick={onClear}>
            {t("recover.clearBalance")}
          </button>
        </div>
      </div>
    </div>
  );
}
