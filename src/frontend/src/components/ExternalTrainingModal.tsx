import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Dataset } from "../backend.d";
import { DatasetStatus } from "../backend.d";
import { HashDisplay } from "./HashDisplay";
import { StatusBadge } from "./StatusBadge";

interface ExternalTrainingModalProps {
  dataset: Dataset | null;
  trainingUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExternalTrainingModal({
  dataset,
  trainingUrl,
  open,
  onOpenChange,
}: ExternalTrainingModalProps) {
  const [copied, setCopied] = useState(false);

  if (!dataset) return null;

  const isVerified = dataset.status === DatasetStatus.verified;
  const isCompromised = dataset.status === DatasetStatus.compromised;
  const qualityOk = dataset.qualityPercentage >= 60;

  // Build a data: URI from the blob's direct URL as a proxy download link
  const datasetDirectUrl = dataset.blob.getDirectURL();
  const platformUrl = trainingUrl.trim();
  const launchUrl = platformUrl
    ? `${platformUrl}?dataset_id=${encodeURIComponent(dataset.id.toString())}&dataset_hash=${encodeURIComponent(dataset.hash)}&dataset_url=${encodeURIComponent(datasetDirectUrl)}`
    : null;

  const handleCopyLink = async () => {
    if (!datasetDirectUrl) return;
    await navigator.clipboard.writeText(datasetDirectUrl);
    setCopied(true);
    toast.success("Dataset download link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunch = () => {
    if (!launchUrl) {
      toast.error("No training platform URL configured");
      return;
    }
    window.open(launchUrl, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = datasetDirectUrl;
    a.download = `${dataset.name}.csv`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="external_training.dialog"
        className="bg-card border-border text-foreground max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            {isVerified ? (
              <Shield className="w-5 h-5 text-[oklch(0.68_0.18_152)]" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-destructive" />
            )}
            External Training
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Dataset verification summary before launching external platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Dataset Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-lg bg-muted/30 border border-border/60 p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {dataset.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Quality: {dataset.qualityPercentage.toFixed(1)}%
                </p>
              </div>
              <StatusBadge status={dataset.status} size="sm" />
            </div>

            {/* Quality bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Dataset quality</span>
                <span className="font-mono">
                  {dataset.qualityPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dataset.qualityPercentage}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${qualityOk ? "bg-[oklch(0.68_0.18_152)]" : "bg-destructive"}`}
                />
              </div>
            </div>
          </motion.div>

          {/* Verification Status */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
            className={`rounded-lg border p-4 ${
              isVerified
                ? "border-[oklch(0.68_0.18_152)]/30 bg-[oklch(0.68_0.18_152)]/5"
                : isCompromised
                  ? "border-destructive/30 bg-destructive/5"
                  : "border-yellow-500/30 bg-yellow-500/5"
            }`}
          >
            {isVerified ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[oklch(0.68_0.18_152)] shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[oklch(0.68_0.18_152)]">
                    Dataset Verified
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    SHA-256 hash confirmed on-chain. Safe to use for training.
                  </p>
                </div>
              </div>
            ) : isCompromised ? (
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive shrink-0" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Dataset Integrity Compromised
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hash mismatch detected. External training is blocked.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-yellow-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-500">
                    Dataset Not Verified
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Only verified datasets can be used for external training.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* On-chain hash */}
          {isVerified && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
            >
              <HashDisplay hash={dataset.hash} label="On-chain SHA-256 Hash" />
            </motion.div>
          )}

          {/* Download link section */}
          {isVerified && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
              className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-3"
            >
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Use Dataset in External Platform
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Copy the secure download link below and paste it into your
                external training platform (HuggingFace, Colab, SageMaker, etc.)
                to load this verified dataset directly.
              </p>

              <div className="flex items-center gap-2 bg-muted/40 rounded-md px-3 py-2 border border-border/40">
                <code className="text-[10px] font-mono text-muted-foreground flex-1 truncate">
                  {datasetDirectUrl || "No direct URL available"}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                  className="h-6 w-6 p-0 shrink-0 hover:bg-accent"
                  data-ocid="external_training.copy_link_button"
                  title="Copy dataset URL"
                >
                  {copied ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[oklch(0.68_0.18_152)]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                  className="border-border text-xs h-8 px-3 hover:border-primary/50 hover:text-primary"
                  data-ocid="external_training.download_button"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download CSV
                </Button>
                {platformUrl && (
                  <p className="text-xs text-muted-foreground">
                    Or launch the platform below — dataset ID + hash + download
                    URL are passed automatically.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Target platform */}
          {platformUrl && isVerified && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.2 }}
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Will open:{" "}
                <span className="font-mono text-foreground">{platformUrl}</span>
              </span>
            </motion.div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border"
            data-ocid="external_training.cancel_button"
          >
            Cancel
          </Button>
          {isVerified && (
            <Button
              onClick={handleLaunch}
              disabled={!platformUrl}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
              data-ocid="external_training.launch_button"
              title={
                !platformUrl
                  ? "Set a training platform URL on the Training URL page first"
                  : `Launch ${platformUrl}`
              }
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {platformUrl ? "Launch External Platform" : "No URL Configured"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
