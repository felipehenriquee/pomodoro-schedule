import { useCallback, useState } from "react";
import { AgendaView } from "./components/AgendaView";
import { FocusView } from "./components/FocusView";
import { RecoverPrompt } from "./components/RecoverPrompt";
import { SoundPrompt } from "./components/SoundPrompt";
import { useBlocks } from "./hooks/useBlocks";
import { useCurrentBlock } from "./hooks/useCurrentBlock";
import { useAlarm } from "./hooks/useAlarm";
import { useSoundPref } from "./hooks/useSoundPref";
import { useSoundPrompt } from "./hooks/useSoundPrompt";
import { useFocusBalance } from "./hooks/useFocusBalance";
import { isoDate, weekRange } from "./lib/time";

type View = "focus" | "agenda";

export default function App() {
  const [view, setView] = useState<View>("focus");
  const [range, setRange] = useState(() => weekRange());
  const { blocks, error, reload } = useBlocks(range.from, range.to);

  const { current, refresh } = useCurrentBlock();
  const sound = useSoundPref();
  const balance = useFocusBalance(current, reload);
  const prompt = useSoundPrompt(current, sound.soundOn, balance.paused);

  useAlarm({
    soundOn: sound.soundOn,
    paused: balance.paused,
    onBoundary: () => {
      refresh();
      reload();
    },
  });

  // calendar navigation -> materializes/loads the visible range
  const onRangeChange = useCallback((from: string, to: string) => {
    setRange((r) => (r.from === from && r.to === to ? r : { from, to }));
  }, []);

  const todayStr = isoDate(new Date());

  return (
    <>
      {view === "focus" ? (
        <FocusView
          current={current}
          soundOn={sound.soundOn}
          paused={balance.paused}
          onToggleSound={sound.toggle}
          onTogglePause={balance.togglePause}
          onOpenAgenda={() => setView("agenda")}
        />
      ) : (
        <AgendaView
          blocks={blocks}
          error={error}
          current={current}
          soundOn={sound.soundOn}
          paused={balance.paused}
          debtMs={balance.debtMs}
          onToggleSound={sound.toggle}
          onTogglePause={balance.togglePause}
          onOpenRecover={balance.openRecover}
          onReload={reload}
          onRangeChange={onRangeChange}
          onOpenFocus={() => setView("focus")}
        />
      )}

      <SoundPrompt
        open={prompt.promptOpen}
        onActivate={async () => {
          await sound.enable();
          prompt.dismiss();
        }}
        onDismiss={prompt.dismiss}
      />

      <RecoverPrompt
        open={balance.recoverOpen}
        debtMs={balance.debtMs}
        onClose={balance.closeRecover}
        onClear={balance.clear}
        onDoNow={() => balance.createRecovery(todayStr, new Date())}
        onEndOfDay={async () =>
          balance.createRecovery(todayStr, await balance.endOfDayStart(todayStr))
        }
        onPickDateTime={(date, time) =>
          balance.createRecovery(date, new Date(`${date}T${time}:00`))
        }
      />
    </>
  );
}
