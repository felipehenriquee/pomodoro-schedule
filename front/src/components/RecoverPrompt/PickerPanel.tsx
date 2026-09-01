import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isoDate } from "../../lib/time";

type Props = {
  onBack: () => void;
  onConfirm: (date: string, time: string) => void;
};

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

/** "escolher data" branch: date + time inputs, back / schedule. */
export function PickerPanel({ onBack, onConfirm }: Props) {
  const { t } = useTranslation();
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState("18:00");

  return (
    <div className="recover-panel from-right">
      <div className="recover-picker-row">
        <label>
          {t("recover.date")}
          <input
            type="date"
            min={isoDate(new Date())}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          {t("recover.time")}
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </label>
      </div>
      <div className="modal-actions">
        <button className="chip" onClick={onBack}>
          {t("recover.back")}
        </button>
        <button
          className="chip solid"
          disabled={!date || !time}
          onClick={() => onConfirm(date, time)}
        >
          {t("recover.schedule")}
        </button>
      </div>
    </div>
  );
}
