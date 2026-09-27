import { useState } from "react";
import { Check, Copy } from "lucide-react";

export const truncateAddr = (a: string) =>
  a.startsWith("0x") && a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;

export function Address({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const isAddr = value.startsWith("0x");
  return (
    <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
      <span>{truncateAddr(value)}</span>
      {isAddr && (
        <button
          type="button"
          aria-label="Copy address"
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {copied ? <Check className="h-3 w-3 text-pos" /> : <Copy className="h-3 w-3" />}
        </button>
      )}
    </span>
  );
}
