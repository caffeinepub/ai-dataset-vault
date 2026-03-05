import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Save,
  ShieldAlert,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { DatasetStatus } from "../backend.d";
import { StatusBadge } from "../components/StatusBadge";
import { useDatasets, useSetExternalTrainingUrl } from "../hooks/useQueries";

export function AdminPage() {
  const { data: datasets, isLoading } = useDatasets();
  const { mutateAsync: setUrl, isPending: isSaving } =
    useSetExternalTrainingUrl();

  const [trainingUrl, setTrainingUrl] = useState(
    datasets?.find((d) => d.externalTrainingUrl)?.externalTrainingUrl ?? "",
  );

  const verifiedDatasets =
    datasets?.filter((d) => d.status === DatasetStatus.verified) ?? [];

  const handleSaveUrl = async () => {
    if (!trainingUrl.trim()) {
      toast.error("Please enter a valid URL");
      return;
    }
    try {
      await setUrl(trainingUrl.trim());
      toast.success("Training URL saved");
    } catch {
      toast.error("Failed to save URL");
    }
  };

  const handleOpenExternal = (datasetId: bigint, url: string) => {
    const encodedDatasetId = encodeURIComponent(datasetId.toString());
    const fullUrl = `${url}?dataset_id=${encodedDatasetId}`;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">
            External Training
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Configure external AI training platforms for verified datasets
        </p>
      </motion.div>

      {/* External URL Config */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-6 space-y-5"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Training Platform URL
          </h2>
        </div>

        <p className="text-xs text-muted-foreground">
          Set the base URL for an external AI training service (e.g.
          HuggingFace, Colab, SageMaker). Dataset IDs will be appended as query
          parameters.
        </p>

        <div className="space-y-2">
          <Label
            htmlFor="training-url"
            className="text-sm text-foreground font-medium"
          >
            Platform URL
          </Label>
          <Input
            id="training-url"
            data-ocid="admin.url_input"
            value={trainingUrl}
            onChange={(e) => setTrainingUrl(e.target.value)}
            placeholder="https://huggingface.co/datasets/train"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary font-mono text-sm"
            disabled={isSaving}
          />
          <p className="text-xs text-muted-foreground">
            Examples: HuggingFace, Google Colab, AWS SageMaker
          </p>
        </div>

        <Button
          data-ocid="admin.save_button"
          onClick={handleSaveUrl}
          disabled={!trainingUrl.trim() || isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save URL
            </>
          )}
        </Button>
      </motion.div>

      {/* Verified Datasets for External Training */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-card border border-border rounded-lg p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              Verified Datasets
            </h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {verifiedDatasets.length} available
          </span>
        </div>

        {verifiedDatasets.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Only verified datasets can be used for AI training.
            </p>
            <p className="text-xs text-muted-foreground">
              Upload and verify a dataset first to enable external training.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {verifiedDatasets.map((ds, idx) => (
              <motion.div
                key={ds.id.toString()}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                className="flex items-center justify-between py-3 px-4 rounded-md bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <StatusBadge status={ds.status} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ds.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Quality: {ds.qualityPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!trainingUrl.trim()}
                  onClick={() => handleOpenExternal(ds.id, trainingUrl)}
                  className="border-border text-xs h-8 px-3 hover:border-primary/50 hover:text-primary shrink-0 ml-3"
                  data-ocid={`admin.external_link_button.${idx + 1}`}
                  title={
                    !trainingUrl.trim()
                      ? "Set a training platform URL first"
                      : `Open in ${trainingUrl}`
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open External
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
