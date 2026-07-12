import { useState, useRef, useEffect } from "react";

interface InfoIconProps {
  explanation: string;
  example?: string;
}

export function InfoIcon({ explanation, example }: InfoIconProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <span className="info-icon-wrap" ref={ref}>
      <button
        type="button"
        className="info-icon"
        aria-label="More information"
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>
      {open && (
        <div className="info-popover" role="tooltip">
          <p>{explanation}</p>
          {example && (
            <p className="info-example">
              <strong>Example:</strong> {example}
            </p>
          )}
        </div>
      )}
    </span>
  );
}
