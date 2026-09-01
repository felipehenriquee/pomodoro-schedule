import { useTranslation } from "react-i18next";
import { useKinds } from "./kinds";
import type { BlockKind } from "../../models";

type Props = {
  value: BlockKind;
  onChange: (kind: BlockKind) => void;
};

/** The "Tipo" selector: Foco / Pausa curta / Pausa longa. */
export function KindPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const kinds = useKinds();

  return (
    <div className="field">
      <span className="field-label">{t("eventCreate.kind.label")}</span>
      <div className="days">
        {kinds.map((k) => (
          <button
            type="button"
            key={k.key}
            className={value === k.key ? "day on" : "day"}
            onClick={() => onChange(k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}
