import { useTranslation } from "react-i18next";
import { Icon } from "../../Icon";
import type { LongBreakInput } from "../../../models";

type Props = {
  value: LongBreakInput[];
  onChange: (breaks: LongBreakInput[]) => void;
};

/** "Pausas longas": editable list of long breaks + add button. */
export function LongBreaksRow({ value, onChange }: Props) {
  const { t } = useTranslation();

  const update = (i: number, patch: Partial<LongBreakInput>) =>
    onChange(value.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...value,
      {
        start_time: "12:00",
        end_time: "13:00",
        label: t("templateForm.defaults.break"),
      },
    ]);

  return (
    <div className="lb-section">
      <span className="field-label">{t("templateForm.longBreaks")}</span>

      {value.map((b, i) => (
        <div className="lb-item" key={i}>
          <div className="lb-box">
            <input
              className="lb-label"
              value={b.label}
              placeholder={t("templateForm.breakLabel")}
              onChange={(e) => update(i, { label: e.target.value })}
            />
            <div className="row">
              <label>
                {t("templateForm.start")}
                <input
                  type="time"
                  value={b.start_time}
                  onChange={(e) => update(i, { start_time: e.target.value })}
                />
              </label>
              <label>
                {t("templateForm.end")}
                <input
                  type="time"
                  value={b.end_time}
                  onChange={(e) => update(i, { end_time: e.target.value })}
                />
              </label>
            </div>
          </div>
          <button
            type="button"
            className="row-ico lb-del"
            title={t("templateForm.removeLongBreak")}
            onClick={() => remove(i)}
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      ))}

      <button type="button" className="chip lb-add" onClick={add}>
        {t("templateForm.addLongBreak")}
      </button>
    </div>
  );
}
