type Props = {
  value: string;
  onChange: (name: string) => void;
};

export function NameRow({ value, onChange }: Props) {
  return (
    <label>
      Nome
      <input value={value} onChange={(e) => onChange(e.target.value)} required />
    </label>
  );
}
