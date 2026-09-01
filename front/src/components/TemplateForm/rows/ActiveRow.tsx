import { useTranslation } from "react-i18next";

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ActiveRow({ checked, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {t("templateForm.active")}
    </label>
  );
}
