import { useTranslation } from "react-i18next";

type Props = {
  value: string | null;
  min: string;
  onChange: (date: string | null) => void;
};

/** freq === "once": a single date. */
export function FrequencyOnce({ value, min, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <label>
      {t("templateForm.date")}
      <input
        type="date"
        min={min}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
    </label>
  );
}
