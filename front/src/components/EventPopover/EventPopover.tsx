import { PopoverHead } from "./PopoverHead";
import { PopoverBody } from "./PopoverBody";
import { PopoverRow } from "./PopoverRow";
import type { Block, BlockKind } from "../../models";

const KIND_LABEL: Record<BlockKind, string> = {
  work: "Foco",
  short_break: "Pausa curta",
  long_break: "Pausa longa",
};

type Props = {
  block: Block;
  x: number;
  y: number;
  paused: boolean;
  onTogglePause: () => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onClose: () => void;
};

export function EventPopover({
  block,
  x,
  y,
  paused,
  onTogglePause,
  onView,
  onEdit,
  onDelete,
  onRestore,
  onClose,
}: Props) {
  const left = Math.max(8, Math.min(x, window.innerWidth - 308));
  const top = Math.max(8, Math.min(y, window.innerHeight - 236));
  const name = block.label ?? KIND_LABEL[block.kind];
  const cancelled = block.status === "skipped";

  const now = Date.now();
  const canPause =
    !cancelled &&
    new Date(block.start_ts).getTime() <= now &&
    now < new Date(block.end_ts).getTime(); // event happening right now (any kind)

  return (
    <>
      <div className="popover-backdrop" onClick={onClose} />
      <div className="event-popover" style={{ left, top }}>
        <PopoverHead
          name={name}
          onView={onView}
          onEdit={onEdit}
          onClose={onClose}
        />
        <PopoverBody block={block} cancelled={cancelled} />
        <PopoverRow
          cancelled={cancelled}
          canPause={canPause}
          paused={paused}
          onRestore={onRestore}
          onDelete={onDelete}
          onTogglePause={onTogglePause}
        />
      </div>
    </>
  );
}
