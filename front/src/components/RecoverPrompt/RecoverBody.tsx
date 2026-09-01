import { useState } from "react";
import { PickerPanel } from "./PickerPanel";
import { ButtonsPanel } from "./ButtonsPanel";

type Props = {
  onClose: () => void;
  onDoNow: () => void;
  onEndOfDay: () => void;
  onClear: () => void;
  onPickDateTime: (date: string, time: string) => void;
};

/** Switches between the buttons panel and the date picker. */
export function RecoverBody({
  onClose,
  onDoNow,
  onEndOfDay,
  onClear,
  onPickDateTime,
}: Props) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="recover-switch-wrap">
      {picking ? (
        <PickerPanel
          key="picker"
          onBack={() => setPicking(false)}
          onConfirm={onPickDateTime}
        />
      ) : (
        <ButtonsPanel
          key="buttons"
          onClose={onClose}
          onDoNow={onDoNow}
          onEndOfDay={onEndOfDay}
          onClear={onClear}
          onPick={() => setPicking(true)}
        />
      )}
    </div>
  );
}
