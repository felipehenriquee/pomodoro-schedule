import { RecoverHeader } from "./RecoverHeader";
import { RecoverBody } from "./RecoverBody";

type Props = {
  open: boolean;
  debtMs: number;
  onClose: () => void; // "agora não" (dismiss)
  onClear: () => void; // clear the balance
  onDoNow: () => void; // create a block starting now
  onEndOfDay: () => void; // create a block at the end of today
  onPickDateTime: (date: string, time: string) => void; // chosen date + time
};

export function RecoverPrompt({
  open,
  debtMs,
  onClose,
  onClear,
  onDoNow,
  onEndOfDay,
  onPickDateTime,
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <RecoverHeader debtMs={debtMs} />
        <RecoverBody
          onClose={onClose}
          onDoNow={onDoNow}
          onEndOfDay={onEndOfDay}
          onClear={onClear}
          onPickDateTime={onPickDateTime}
        />
      </div>
    </div>
  );
}
