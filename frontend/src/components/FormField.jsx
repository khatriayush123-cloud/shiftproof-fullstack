/**
 * FormField — unified input component.
 * Renders a <select> when an `options` array is passed,
 * otherwise renders an <input> of the given type.
 * Handles: text, password, date, time, number, select.
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  helper,
  error,
  options,
}) {
  const fieldId = name;

  const fieldClasses = [
    'w-full rounded-lg border px-4 py-3 text-ink bg-card text-base',
    'transition-all duration-150',
    'hover:border-ink/30',
    'focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal',
    'placeholder:text-muted/60',
    'motion-reduce:transition-none',
    error ? 'border-caution' : 'border-border',
  ].join(' ');

  return (
    <div className="mb-4">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink mb-1.5">
        {label}
      </label>

      {options ? (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          className={fieldClasses}
        >
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={fieldClasses}
        />
      )}

      {helper && !error && (
        <p className="mt-1.5 text-sm text-muted">{helper}</p>
      )}

      {/* Validation errors use the caution colour, not breach (red).
          Red is reserved exclusively for exceeding the visa 48-hour limit. */}
      {error && (
        <p className="mt-1.5 text-sm text-caution font-medium">{error}</p>
      )}
    </div>
  );
}
