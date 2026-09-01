import { Trans, useTranslation } from "react-i18next";
import { fmtDuration } from "../../lib/time";

type Props = { debtMs: number };

/** Title + how much paused focus is pending. */
export function RecoverHeader({ debtMs }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <h3>{t("recover.title")}</h3>
      <p>
        <Trans
          i18nKey="recover.body"
          values={{ amount: fmtDuration(debtMs) }}
          components={{ strong: <strong /> }}
        />
      </p>
    </>
  );
}
