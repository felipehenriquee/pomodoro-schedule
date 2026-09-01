import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  onChange: (name: string) => void;
};

export function NameRow({ value, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <label>
      {t("templateForm.name")}
      <input value={value} onChange={(e) => onChange(e.target.value)} required />
    </label>
  );
}
