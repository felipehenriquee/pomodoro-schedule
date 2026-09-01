type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ActiveRow({ checked, onChange }: Props) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      Agenda ativa
    </label>
  );
}
