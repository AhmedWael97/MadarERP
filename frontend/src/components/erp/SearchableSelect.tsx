import { useEffect, useMemo, useState } from 'react';

export interface SearchableOption {
  value: string;
  label?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  required?: boolean;
  className?: string;
  listId: string;
}

/**
 * Lightweight searchable select based on datalist.
 * Users can type either option label or value; selection always stores `value`.
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
  listId,
}: Props) {
  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );
  const [inputValue, setInputValue] = useState(selected?.label ?? value ?? '');

  useEffect(() => {
    setInputValue(selected?.label ?? value ?? '');
  }, [selected, value]);

  function resolveTyped(raw: string): string | null {
    const q = raw.trim();
    if (!q) return '';
    const exact = options.find(
      (o) => o.value.toLowerCase() === q.toLowerCase() || (o.label ?? '').toLowerCase() === q.toLowerCase(),
    );
    return exact?.value ?? null;
  }

  return (
    <>
      <input
        type="text"
        list={listId}
        value={inputValue}
        onChange={(e) => {
          const raw = e.target.value;
          setInputValue(raw);
          const resolved = resolveTyped(raw);
          if (resolved !== null) onChange(resolved);
        }}
        onBlur={() => {
          const resolved = resolveTyped(inputValue);
          if (resolved !== null) {
            onChange(resolved);
            const next = options.find((o) => o.value === resolved);
            setInputValue(next?.label ?? resolved);
          } else {
            setInputValue(selected?.label ?? value ?? '');
          }
        }}
        placeholder={placeholder}
        required={required}
        className={className}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.label ?? opt.value} label={opt.value} />
        ))}
      </datalist>
    </>
  );
}
