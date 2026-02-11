interface SettingSwitchProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  isLast?: boolean;
}

export default function SettingSwitch({ label, value, onValueChange, isLast }: SettingSwitchProps) {
  return (
    <label className={`setting-row ${isLast ? 'setting-row-last' : ''}`}>
      <span>{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(event) => onValueChange(event.target.checked)}
      />
    </label>
  );
}