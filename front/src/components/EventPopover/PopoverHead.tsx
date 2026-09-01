import { Icon } from "../Icon";

type Props = {
  name: string;
  onView: () => void;
  onEdit: () => void;
  onClose: () => void;
};

/** Popover header: event name + view / edit / close icons. */
export function PopoverHead({ name, onView, onEdit, onClose }: Props) {
  return (
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
  );
}
