import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Cloud,
  CloudOff,
  FileText,
  Loader2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { HashDisplay } from "../components/HashDisplay";
import { useUploadDataset } from "../hooks/useQueries";
import { computeCSVQuality } from "../utils/csvQuality";
import { sha256Hex } from "../utils/sha256";

interface QualityPreview {
  quality: number;
  totalRows: number;
  validRows: number;
  issues: string[];
}

interface InstantResult {
  quality: number;
  hash: string;
  accepted: boolean;
  /** undefined = in-progress, true = saved, false = failed */
  onChainStatus: undefined | true | false;
}

export function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBytes, setFileBytes] = useState<Uint8Array | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [qualityPreview, setQualityPreview] = useState<QualityPreview | null>(
    null,
  );
  const [instantResult, setInstantResult] = useState<InstantResult | null>(
    null,
  );
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    mutateAsync: uploadDataset,
    isPending,
    isActorLoading,
    isActorReady,
  } = useUploadDataset();

  const loadFile = useCallback(
    (file: File, nameDefault: string) => {
      setSelectedFile(file);
      setInstantResult(null);
      setQualityPreview(null);
      if (!datasetName) setDatasetName(nameDefault);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) setQualityPreview(computeCSVQuality(text));
      };
      reader.readAsText(file);
      // Also load as bytes for hashing
      const bytesReader = new FileReader();
      bytesReader.onload = (ev) => {
        const buf = ev.target?.result as ArrayBuffer;
        if (buf) setFileBytes(new Uint8Array(buf));
      };
      bytesReader.readAsArrayBuffer(file);
    },
    [datasetName],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".csv")) {
        loadFile(file, file.name.replace(".csv", ""));
      } else {
        toast.error("Only CSV files are accepted");
      }
    },
    [loadFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadFile(file, file.name.replace(".csv", ""));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !datasetName.trim()) {
      toast.error("Please select a CSV file and provide a dataset name");
      return;
    }
    if (!qualityPreview) {
      toast.error("File is still loading, please wait a moment");
      return;
    }

    setIsValidating(true);
    setInstantResult(null);
    setUploadProgress(0);

    try {
      // Step 1 — compute hash in browser (instant, ~50ms for typical CSV)
      const bytes =
        fileBytes ?? new Uint8Array(await selectedFile.arrayBuffer());
      const hash = await sha256Hex(bytes);

      const accepted = qualityPreview.quality >= 60;

      if (!accepted) {
        // Rejected immediately — no need to hit the backend
        setInstantResult({
          quality: qualityPreview.quality,
          hash,
          accepted: false,
          onChainStatus: undefined,
        });
        setIsValidating(false);
        toast.error("Dataset quality below 60% — rejected");
        return;
      }

      // Step 2 — show instant verified result to user right away
      setInstantResult({
        quality: qualityPreview.quality,
        hash,
        accepted: true,
        onChainStatus: undefined, // saving in background
      });
      setIsValidating(false);
      toast.success("Dataset verified! Saving to chain...");

      // Step 3 — persist to backend in background (progress bar still shows)
      try {
        await uploadDataset({
          name: datasetName.trim(),
          file: selectedFile,
          onProgress: (pct) => setUploadProgress(pct),
        });
        setInstantResult((prev) =>
          prev ? { ...prev, onChainStatus: true } : prev,
        );
        toast.success("Saved to ICP blockchain");
      } catch (err) {
        let msg = err instanceof Error ? err.message : "Upload failed";
        if (
          msg.includes("Not connected") ||
          msg.includes("not registered") ||
          msg.includes("Failed to fetch") ||
          msg.includes("backend")
        ) {
          msg = "Connection to backend failed. Please refresh and try again.";
        }
        setInstantResult((prev) =>
          prev ? { ...prev, onChainStatus: false } : prev,
        );
        toast.error(msg);
      }
    } catch {
      setIsValidating(false);
      toast.error("Failed to read file. Please try again.");
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFileBytes(null);
    setDatasetName("");
    setInstantResult(null);
    setUploadProgress(0);
    setQualityPreview(null);
    setIsValidating(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isWorking = isValidating || isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold font-display text-foreground">
          Upload Dataset
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          CSV files are validated instantly in your browser — quality, hash, and
          on-chain storage happen in under a second
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-card border border-border rounded-lg p-6 space-y-5"
      >
        {/* Dataset Name */}
        <div className="space-y-2">
          <Label
            htmlFor="dataset-name"
            className="text-sm text-foreground font-medium"
          >
            Dataset Name
          </Label>
          <Input
            id="dataset-name"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="e.g. Medical Training Data v2"
            className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-primary font-mono text-sm"
            disabled={isWorking}
            data-ocid="upload.input"
          />
        </div>

        {/* Drop Zone */}
        <label
          data-ocid="upload.dropzone"
          aria-label="Upload CSV file drop zone"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 block
            ${dragOver ? "border-primary bg-primary/5 border-glow-cyan" : "border-border hover:border-primary/50 hover:bg-muted/20"}
            ${isWorking ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          `}
        >
          <div className="absolute inset-0 bg-grid-pattern rounded-lg opacity-20 pointer-events-none" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            disabled={isWorking}
          />

          <AnimatePresence mode="wait">
            {selectedFile ? (
              <motion.div
                key="file-selected"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center gap-2"
              >
                <FileText className="w-10 h-10 text-primary" />
                <span className="font-mono text-sm text-foreground">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="upload-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3"
              >
                <Upload className="w-10 h-10 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Drop your CSV file here
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or click to browse — CSV only
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </label>

        {/* Live Quality Preview — shown before submit */}
        <AnimatePresence>
          {qualityPreview && !isWorking && !instantResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className={`rounded-md p-3 border text-sm space-y-1.5 ${
                  qualityPreview.quality >= 60
                    ? "bg-[oklch(0.68_0.18_152/0.06)] border-[oklch(0.68_0.18_152/0.25)]"
                    : "bg-[oklch(0.60_0.22_25/0.06)] border-[oklch(0.60_0.22_25/0.25)]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                    Pre-validation
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold ${
                      qualityPreview.quality >= 60
                        ? "text-[oklch(0.75_0.18_152)]"
                        : "text-destructive"
                    }`}
                  >
                    {qualityPreview.quality.toFixed(1)}% quality
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-mono">
                  {qualityPreview.validRows} valid rows /{" "}
                  {qualityPreview.totalRows} total
                </p>
                {qualityPreview.issues.length > 0 && (
                  <div className="space-y-0.5">
                    {qualityPreview.issues.map((issue) => (
                      <p
                        key={issue}
                        className="text-xs text-muted-foreground flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />
                        {issue}
                      </p>
                    ))}
                  </div>
                )}
                {qualityPreview.quality < 60 && (
                  <p className="text-xs text-destructive flex items-center gap-1.5 font-medium pt-0.5">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    Quality below 60% — this dataset will be rejected
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* On-chain save progress — shown after instant result while backend persists */}
        <AnimatePresence>
          {instantResult?.accepted &&
            instantResult.onChainStatus === undefined &&
            isPending && (
              <motion.div
                data-ocid="upload.loading_state"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Cloud className="w-3.5 h-3.5 animate-pulse" />
                    Saving to ICP blockchain...
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-1.5" />
              </motion.div>
            )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            data-ocid="upload.submit_button"
            onClick={handleSubmit}
            disabled={
              !selectedFile ||
              !datasetName.trim() ||
              isWorking ||
              isActorLoading ||
              !isActorReady
            }
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {isActorLoading || !isActorReady ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Validate
              </>
            )}
          </Button>
          {(selectedFile || instantResult) && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isValidating}
              className="border-border"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Instant Result Panel */}
      <AnimatePresence>
        {instantResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`border rounded-lg p-6 space-y-4 ${
              instantResult.accepted
                ? "bg-[oklch(0.68_0.18_152/0.08)] border-[oklch(0.68_0.18_152/0.3)]"
                : "bg-[oklch(0.60_0.22_25/0.08)] border-[oklch(0.60_0.22_25/0.3)]"
            }`}
            data-ocid={
              instantResult.accepted
                ? "upload.success_state"
                : "upload.error_state"
            }
          >
            {/* Status header */}
            <div className="flex items-start gap-3">
              {instantResult.accepted ? (
                <CheckCircle className="w-5 h-5 text-[oklch(0.75_0.18_152)] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {instantResult.accepted
                    ? "Dataset verified — quality check passed"
                    : "Dataset rejected — quality below 60%"}
                </p>
              </div>
            </div>

            {/* Quality Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground uppercase tracking-widest">
                  Data Quality
                </span>
                <span
                  className={
                    instantResult.quality >= 60
                      ? "text-[oklch(0.75_0.18_152)]"
                      : "text-destructive"
                  }
                >
                  {instantResult.quality.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${instantResult.quality}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    instantResult.quality >= 60
                      ? "bg-[oklch(0.68_0.18_152)]"
                      : "bg-destructive"
                  }`}
                />
              </div>
              {instantResult.quality < 60 && (
                <p className="text-xs text-muted-foreground">
                  Quality must be ≥ 60% to be accepted. Remove missing values,
                  nulls, and duplicates.
                </p>
              )}
            </div>

            {/* Hash */}
            {instantResult.hash && (
              <HashDisplay hash={instantResult.hash} label="SHA-256 Hash" />
            )}

            {/* Verification Badge — shown immediately for accepted datasets */}
            {instantResult.accepted && (
              <div className="flex items-center gap-2 py-2 px-3 rounded bg-[oklch(0.68_0.18_152/0.1)] border border-[oklch(0.68_0.18_152/0.3)]">
                <CheckCircle className="w-4 h-4 text-[oklch(0.75_0.18_152)]" />
                <span className="text-sm font-medium text-[oklch(0.75_0.18_152)]">
                  Dataset verified (SHA-256 integrity confirmed)
                </span>
              </div>
            )}

            {/* On-chain save status */}
            {instantResult.accepted && (
              <div className="flex items-center gap-2 py-2 px-3 rounded border border-border text-xs font-mono">
                {instantResult.onChainStatus === undefined ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-muted-foreground animate-pulse" />
                    <span className="text-muted-foreground">
                      Saving to ICP blockchain...
                    </span>
                  </>
                ) : instantResult.onChainStatus === true ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-[oklch(0.75_0.18_152)]" />
                    <span className="text-[oklch(0.75_0.18_152)]">
                      Stored on ICP blockchain
                    </span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-destructive">
                      On-chain save failed — please retry
                    </span>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
