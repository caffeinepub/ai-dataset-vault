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
  Target,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DatasetStatus } from "../backend.d";
import { useDatasets, useTrainModel } from "../hooks/useQueries";
import type { Metrics } from "../hooks/useQueries";

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

  const verifiedDatasets =
    datasets?.filter((d) => d.status === DatasetStatus.verified) ?? [];

  const handleTrain = async () => {
    if (!selectedId) {
      toast.error("Select a verified dataset first");
      return;
    }

    setMetrics(null);
    setCompromised(false);

    try {
      const result = await trainModel(BigInt(selectedId));
      const firstMetric = result.metrics[0] ?? null;

      if (!firstMetric) {
        setCompromised(true);
        toast.error("Dataset integrity compromised — training blocked");
      } else {
        setMetrics(firstMetric);
        toast.success("Model training complete");
      }
    } catch (err) {
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

          {isPending && (
            <motion.div
              data-ocid="train.loading_state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-3 py-4"
            >
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground font-mono">
                Running integrity checks and training model...
              </span>
            </motion.div>
          )}
        </motion.div>

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
