import { Icon } from "./Icon";
import { fmtFullDate, fmtHM, freqLabel } from "../lib/time";
import type { Block, BlockKind } from "../models";

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
        <div className="event-popover-head">
          <strong>{name}</strong>
          <div className="event-popover-icons">
            <button className="row-ico" title="Visualizar" onClick={onView}>
              <Icon name="visibility" size={18} />
            </button>
            <button className="row-ico" title="Editar" onClick={onEdit}>
              <Icon name="edit" size={18} />
            </button>
            <button className="row-ico" title="Fechar" onClick={onClose}>
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>

        <div className="event-popover-body">
          <div className="epr">{fmtFullDate(block.start_ts)}</div>
          <div className="epr">
            {fmtHM(block.start_ts)} &ndash; {fmtHM(block.end_ts)}
          </div>
          <div className="epr epr-dim">
            {cancelled
              ? "Cancelado"
              : freqLabel(block.freq, block.days_of_week, block.interval_days)}
          </div>
        </div>

        {cancelled ? (
          <div className="event-popover-row">
            <button className="chip" onClick={onRestore}>
              <Icon name="restore" size={18} />
              retomar
            </button>
            <button className="chip solid danger" onClick={onDelete}>
              <Icon name="delete" size={18} />
              excluir
            </button>
          </div>
        ) : (
          <button className="chip pause-chip danger" onClick={onDelete}>
            <Icon name="block" size={18} />
            cancelar evento
          </button>
        )}

        {canPause && (
          <button className="chip pause-chip" onClick={onTogglePause}>
            <Icon name={paused ? "play_arrow" : "pause"} size={18} />
            {paused ? "retomar alarme" : "pausar alarme"}
          </button>
        )}
      </div>
    </>
  );
}
