import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertTriangle,
  BarChart3,
  Cpu,
  Loader2,
  Shield,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DatasetStatus } from "../backend.d";
import { useDatasets, useTrainModel } from "../hooks/useQueries";
import type { Metrics } from "../hooks/useQueries";

type VerifyPhase = "idle" | "verifying" | "verified" | "failed";

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  delay: number;
}

function MetricCard({
  label,
  value,
  icon,
  colorClass,
  delay,
}: MetricCardProps) {
  const percentage = Math.round(value * 100);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border rounded-lg p-6 space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className={colorClass}>{icon}</span>
        <span className="text-sm text-muted-foreground uppercase tracking-widest font-mono">
          {label}
        </span>
      </div>
      <div>
        <span className={`text-5xl font-bold font-display ${colorClass}`}>
          {percentage}
        </span>
        <span className={`text-2xl font-bold font-display ${colorClass}`}>
          %
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: delay + 0.2, ease: "easeOut" }}
          className={`h-full rounded-full bg-current ${colorClass}`}
        />
      </div>
    </motion.div>
  );
}

interface TrainPageProps {
  preselectedDatasetId?: bigint | null;
}

export function TrainPage({ preselectedDatasetId }: TrainPageProps) {
  const { data: datasets, isLoading: datasetsLoading } = useDatasets();
  const { mutateAsync: trainModel, isPending } = useTrainModel();

  const [selectedId, setSelectedId] = useState<string>(
    preselectedDatasetId ? preselectedDatasetId.toString() : "",
  );
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [compromised, setCompromised] = useState(false);
  const [verifyPhase, setVerifyPhase] = useState<VerifyPhase>("idle");

  // When a new training attempt starts, clear previous results
  const resetState = () => {
    setMetrics(null);
    setCompromised(false);
    setVerifyPhase("idle");
  };

  // Transition from verified phase to showing metrics after delay
  useEffect(() => {
    if (verifyPhase === "verified" && metrics) {
      // metrics are already set, just let animation play — no extra delay needed
    }
  }, [verifyPhase, metrics]);

  const verifiedDatasets =
    datasets?.filter((d) => d.status === DatasetStatus.verified) ?? [];

  const handleTrain = async () => {
    if (!selectedId) {
      toast.error("Select a verified dataset first");
      return;
    }

    resetState();
    setVerifyPhase("verifying");

    try {
      const result = await trainModel(BigInt(selectedId));
      const firstMetric = result.metrics[0] ?? null;

      if (!firstMetric) {
        setVerifyPhase("failed");
        setCompromised(true);
        toast.error("Dataset integrity compromised — training blocked");
      } else {
        setVerifyPhase("verified");
        // Slight delay so the verified badge is visible before metrics appear
        setTimeout(() => {
          setMetrics(firstMetric);
          toast.success("Model training complete");
        }, 500);
      }
    } catch (err) {
      setVerifyPhase("failed");
      toast.error(err instanceof Error ? err.message : "Training failed");
    }
  };

  const selectedDataset = datasets?.find((d) => d.id.toString() === selectedId);
  const canTrain =
    !!selectedId && selectedDataset?.status === DatasetStatus.verified;

  if (datasetsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold font-display text-foreground">
            Train Model
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Only verified datasets with intact integrity can be used for
            training
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-lg p-6 space-y-5"
        >
          <div className="space-y-2">
            <label
              htmlFor="train-dataset-select"
              className="text-sm font-medium text-foreground"
            >
              Select Verified Dataset
            </label>
            <Select
              value={selectedId}
              onValueChange={setSelectedId}
              disabled={isPending}
            >
              <SelectTrigger
                data-ocid="train.select"
                className="bg-input border-border text-foreground focus:border-primary"
              >
                <SelectValue placeholder="Choose a dataset..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {verifiedDatasets.length === 0 ? (
                  <div className="py-4 px-2 text-sm text-muted-foreground text-center">
                    No verified datasets available
                  </div>
                ) : (
                  verifiedDatasets.map((ds) => (
                    <SelectItem
                      key={ds.id.toString()}
                      value={ds.id.toString()}
                      className="text-foreground focus:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <span>{ds.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {ds.qualityPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block">
                <Button
                  data-ocid="train.submit_button"
                  onClick={handleTrain}
                  disabled={!canTrain || isPending}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-medium disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Training Model...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4 mr-2" />
                      Start Training
                    </>
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            {!canTrain && !isPending && (
              <TooltipContent side="bottom" className="text-xs">
                Select a verified dataset to enable training
              </TooltipContent>
            )}
          </Tooltip>
        </motion.div>

        {/* Security Verification Panel */}
        <AnimatePresence mode="wait">
          {verifyPhase === "verifying" && (
            <motion.div
              key="verifying"
              data-ocid="train.security_check_panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-card border border-primary/30 rounded-lg p-6"
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="absolute -inset-1 rounded-full border border-primary/20 animate-ping" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    <span className="text-sm font-semibold text-foreground font-mono">
                      Verifying SHA-256 integrity...
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Comparing on-chain hash with dataset hash
                  </p>
                </div>
              </div>
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="h-full bg-primary rounded-full"
                />
              </div>
            </motion.div>
          )}

          {verifyPhase === "verified" && (
            <motion.div
              key="verified"
              data-ocid="train.integrity_verified"
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="bg-[oklch(0.68_0.18_152/0.08)] border border-[oklch(0.68_0.18_152/0.4)] rounded-lg p-5"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[oklch(0.68_0.18_152/0.15)] border border-[oklch(0.68_0.18_152/0.4)] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[oklch(0.75_0.18_152)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[oklch(0.75_0.18_152)]">
                    SHA-256 Hash Verified
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Integrity confirmed — training authorized
                  </p>
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 15,
                    delay: 0.1,
                  }}
                  className="ml-auto"
                >
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full status-verified">
                    PASSED
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Compromised Alert */}
        <AnimatePresence>
          {compromised && (
            <motion.div
              data-ocid="train.error_state"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Alert className="border-[oklch(0.72_0.18_60/0.5)] bg-[oklch(0.72_0.18_60/0.08)]">
                <AlertTriangle className="w-4 h-4 text-[oklch(0.75_0.18_60)]" />
                <AlertTitle className="text-[oklch(0.75_0.18_60)] font-display">
                  Dataset Integrity Compromised
                </AlertTitle>
                <AlertDescription className="text-muted-foreground text-sm">
                  The dataset hash does not match the on-chain record. Training
                  has been blocked to protect model integrity. The dataset has
                  been marked as compromised.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Training Results */}
        <AnimatePresence>
          {metrics && (
            <motion.div
              data-ocid="train.success_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="uppercase tracking-widest font-mono text-xs">
                  Training Results
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                  label="Accuracy"
                  value={metrics.accuracy}
                  icon={<Target className="w-4 h-4" />}
                  colorClass="text-primary"
                  delay={0}
                />
                <MetricCard
                  label="Precision"
                  value={metrics.precision}
                  icon={<Zap className="w-4 h-4" />}
                  colorClass="text-[oklch(0.75_0.18_152)]"
                  delay={0.1}
                />
                <MetricCard
                  label="Recall"
                  value={metrics.recall}
                  icon={<BarChart3 className="w-4 h-4" />}
                  colorClass="text-[oklch(0.75_0.18_60)]"
                  delay={0.2}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
