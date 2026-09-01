import { fmtDuration } from "../../lib/time";

type Props = { debtMs: number };

/** Title + how much paused focus is pending. */
export function RecoverHeader({ debtMs }: Props) {
  return (
    <>
      <h3>Tempo de foco pausado</h3>
      <p>
        Ficaram <strong>{fmtDuration(debtMs)}</strong> de foco em pausa. Deseja
        fazer agora?
      </p>
    </>
  );
}
