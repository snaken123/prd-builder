interface CheckboxGroupProps {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}

export function CheckboxGroup({ options, values, onChange }: CheckboxGroupProps) {
  function toggle(option: string) {
    if (values.includes(option)) {
      onChange(values.filter((v) => v !== option));
    } else {
      onChange([...values, option]);
    }
  }

  return (
    <div className="checkbox-group">
      {options.map((option) => (
        <label key={option} className="checkbox-option">
          <input
            type="checkbox"
            checked={values.includes(option)}
            onChange={() => toggle(option)}
          />
          {option}
        </label>
      ))}
    </div>
  );
}
