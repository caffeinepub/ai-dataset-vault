import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { DatasetStatus } from "../backend.d";

interface StatusBadgeProps {
  status: DatasetStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const sizeClass =
    size === "sm" ? "text-xs px-2 py-0.5 gap-1" : "text-sm px-3 py-1 gap-1.5";

  if (status === DatasetStatus.verified) {
    return (
      <span
        className={`inline-flex items-center font-mono rounded-full font-medium status-verified ${sizeClass}`}
      >
        <CheckCircle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        Verified
      </span>
    );
  }

  if (status === DatasetStatus.compromised) {
    return (
      <span
        className={`inline-flex items-center font-mono rounded-full font-medium status-compromised ${sizeClass}`}
      >
        <AlertTriangle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
        Compromised
      </span>
    );
  }

  // rejected
  return (
    <span
      className={`inline-flex items-center font-mono rounded-full font-medium status-rejected ${sizeClass}`}
    >
      <XCircle className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      Rejected
    </span>
  );
}
