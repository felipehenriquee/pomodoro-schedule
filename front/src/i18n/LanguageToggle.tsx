import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import type { Lang } from "./index";

const TARGET: Record<Lang, string> = { pt: "português", en: "inglês" };

type Props = {
  className?: string;
  /** Called after the language is switched (e.g. to close a menu). */
  onChange?: () => void;
};

/** Menu item that switches the UI language between Portuguese and English. */
export function LanguageToggle({
  className = "header-menu-item",
  onChange,
}: Props) {
  const { i18n } = useTranslation();
  const current: Lang = i18n.language === "en" ? "en" : "pt";
  const next: Lang = current === "pt" ? "en" : "pt";
  const label = `Trocar idioma para ${TARGET[next]}`;

  return (
    <button
      type="button"
      className={className}
      title={label}
      onClick={() => {
        void i18n.changeLanguage(next);
        onChange?.();
      }}
    >
      <Icon name="translate" size={16} />
      {label}
    </button>
  );
}
