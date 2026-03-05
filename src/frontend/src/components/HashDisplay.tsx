import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface HashDisplayProps {
  hash: string;
  label?: string;
}

export function HashDisplay({ hash, label = "Hash" }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shortHash =
    hash.length > 20 ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : hash;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2 bg-muted/50 border border-border rounded px-3 py-2 group">
        <span
          className="font-mono text-xs text-primary flex-1 min-w-0 truncate text-glow-cyan"
          title={hash}
        >
          {shortHash}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary shrink-0"
          title="Copy full hash"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-[oklch(0.68_0.18_152)]" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
