import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle,
  Cpu,
  FileText,
  Shield,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { useAuditLog } from "../hooks/useQueries";

interface AuditEntry {
  event: {
    uploaded?: null;
    rejected?: null;
    verified?: null;
    tamperDetected?: null;
    trainingStarted?: null;
    deleted?: null;
  };
  datasetId: bigint | null | undefined;
  caller: { toString(): string };
  timestamp: bigint;
}

type EventKey =
  | "uploaded"
  | "rejected"
  | "verified"
  | "tamperDetected"
  | "trainingStarted"
  | "deleted";

function getEventKey(event: AuditEntry["event"]): EventKey | "unknown" {
  if ("uploaded" in event) return "uploaded";
  if ("rejected" in event) return "rejected";
  if ("verified" in event) return "verified";
  if ("tamperDetected" in event) return "tamperDetected";
  if ("trainingStarted" in event) return "trainingStarted";
  if ("deleted" in event) return "deleted";
  return "unknown";
}

const EVENT_CONFIG: Record<
  EventKey | "unknown",
  {
    label: string;
    colorClass: string;
    bgClass: string;
    icon: React.ReactNode;
  }
> = {
  uploaded: {
    label: "Uploaded",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/30 border-border/50",
    icon: <Upload className="w-3.5 h-3.5" />,
  },
  verified: {
    label: "Verified",
    colorClass: "text-[oklch(0.75_0.18_152)]",
    bgClass: "bg-[oklch(0.68_0.18_152/0.1)] border-[oklch(0.68_0.18_152/0.3)]",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  rejected: {
    label: "Rejected",
    colorClass: "text-destructive",
    bgClass: "bg-[oklch(0.60_0.22_25/0.08)] border-[oklch(0.60_0.22_25/0.25)]",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  tamperDetected: {
    label: "Tamper Detected",
    colorClass: "text-[oklch(0.75_0.18_60)]",
    bgClass: "bg-[oklch(0.72_0.18_60/0.08)] border-[oklch(0.72_0.18_60/0.25)]",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  trainingStarted: {
    label: "Training Started",
    colorClass: "text-primary",
    bgClass: "bg-primary/5 border-primary/20",
    icon: <Cpu className="w-3.5 h-3.5" />,
  },
  deleted: {
    label: "Deleted",
    colorClass: "text-destructive/70",
    bgClass: "bg-[oklch(0.60_0.22_25/0.05)] border-[oklch(0.60_0.22_25/0.15)]",
    icon: <Trash2 className="w-3.5 h-3.5" />,
  },
  unknown: {
    label: "Unknown",
    colorClass: "text-muted-foreground",
    bgClass: "bg-muted/30 border-border/50",
    icon: <Shield className="w-3.5 h-3.5" />,
  },
};

function formatTimestamp(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function shortenPrincipal(p: string): string {
  if (p.length <= 14) return p;
  return `${p.slice(0, 7)}...${p.slice(-5)}`;
}

export function AuditLogPage() {
  const { data: entries, isLoading } = useAuditLog();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">
            Audit Log
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Tamper-proof record of all dataset and training events
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-lg overflow-hidden"
      >
        {!entries || entries.length === 0 ? (
          <div
            data-ocid="audit.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="absolute inset-0 rounded-full ring-2 ring-border/50 animate-ping" />
            </div>
            <p className="text-foreground font-medium mb-1">
              No audit events yet
            </p>
            <p className="text-muted-foreground text-sm">
              Events will appear here after uploads, validations, and training
              sessions
            </p>
          </div>
        ) : (
          <Table data-ocid="audit.table">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
                  Event
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono hidden sm:table-cell">
                  Dataset ID
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono hidden md:table-cell">
                  Caller
                </TableHead>
                <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
                  Time
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...(entries as AuditEntry[])]
                .sort((a, b) => Number(b.timestamp - a.timestamp))
                .map((entry, idx) => {
                  const key = getEventKey(entry.event);
                  const cfg = EVENT_CONFIG[key];
                  const callerStr = entry.caller?.toString() ?? "—";
                  const rowKey = `${entry.timestamp.toString()}-${idx}`;
                  return (
                    <TableRow
                      key={rowKey}
                      data-ocid={`audit.row.${idx + 1}`}
                      className="border-border hover:bg-muted/20 transition-colors"
                    >
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2 py-0.5 rounded border ${cfg.colorClass} ${cfg.bgClass}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono hidden sm:table-cell">
                        {entry.datasetId != null
                          ? `#${entry.datasetId.toString()}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono hidden md:table-cell">
                        <span title={callerStr}>
                          {shortenPrincipal(callerStr)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs font-mono">
                        {formatTimestamp(entry.timestamp)}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        )}
      </motion.div>
    </div>
  );
}
