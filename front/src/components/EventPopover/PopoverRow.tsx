import { Icon } from "../Icon";

type Props = {
  cancelled: boolean;
  canPause: boolean;
  paused: boolean;
  onRestore: () => void;
  onDelete: () => void;
  onTogglePause: () => void;
};

/**
 * Popover action row: restore/delete when cancelled, otherwise "cancelar
 * evento"; plus the pause-alarm chip when the event is happening now.
 */
export function PopoverRow({
  cancelled,
  canPause,
  paused,
  onRestore,
  onDelete,
  onTogglePause,
}: Props) {
  return (
    <>
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
    </>
  );
}
