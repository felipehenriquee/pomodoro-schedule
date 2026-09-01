import { isoDate } from "../../../lib/time";
import type { TemplateInput } from "../../../models";

type ValidityPatch = Partial<
  Pick<TemplateInput, "valid_from" | "valid_until">
>;

type Props = {
  validFrom: string | null;
  validUntil: string | null;
  editing: boolean;
  today: string;
  onChange: (patch: ValidityPatch) => void;
};

function nextDay(ds: string): string {
  const d = new Date(ds + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

/** Optional validity window: "Válido de" / "Válido até". */
export function ValidityRow({
  validFrom,
  validUntil,
  editing,
  today,
  onChange,
}: Props) {
  const minValidUntil = nextDay(validFrom ?? today);

  return (
    <div className="field">
      <span className="field-label">Validade (opcional)</span>
      <div className="row">
        <label>
          Válido de
          <input
            type="date"
            min={today}
            disabled={editing}
            title={editing ? "não pode mudar depois de criada" : undefined}
            value={validFrom ?? ""}
            onChange={(e) => {
              const v = e.target.value || null;
              onChange({
                valid_from: v,
                valid_until: !v
                  ? null
                  : validUntil && validUntil <= v
                    ? nextDay(v)
                    : validUntil,
              });
            }}
          />
        </label>
        <label>
          Válido até
          <input
            type="date"
            min={minValidUntil}
            disabled={!validFrom}
            value={validUntil ?? ""}
            onChange={(e) => onChange({ valid_until: e.target.value || null })}
          />
        </label>
      </div>
    </div>
  );
}
