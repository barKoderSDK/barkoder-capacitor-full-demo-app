interface SettingDropdownOption {
  label: string;
  value: number;
}

interface SettingDropdownProps {
  label: string;
  options: SettingDropdownOption[];
  selectedValue: number | undefined;
  onSelect: (value: number) => void;
  isLast?: boolean;
}

export default function SettingDropdown({
  label,
  options,
  selectedValue,
  onSelect,
  isLast,
}: SettingDropdownProps) {
  return (
    <label className={`setting-row ${isLast ? 'setting-row-last' : ''}`}>
      <span>{label}</span>
      <select
        value={selectedValue}
        onChange={(event) => onSelect(Number(event.target.value))}
        className="setting-select"
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}