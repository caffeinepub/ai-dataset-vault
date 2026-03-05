import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
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

interface UploadResult {
  success: boolean;
  datasetId?: bigint;
  qualityPercentage: number;
  hash: string;
  message: string;
}

export function UploadPage() {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: uploadDataset, isPending } = useUploadDataset();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file?.name.endsWith(".csv")) {
        setSelectedFile(file);
        setResult(null);
        if (!datasetName) setDatasetName(file.name.replace(".csv", ""));
      } else {
        toast.error("Only CSV files are accepted");
      }
    },
    [datasetName],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
      if (!datasetName) setDatasetName(file.name.replace(".csv", ""));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !datasetName.trim()) {
      toast.error("Please select a CSV file and provide a dataset name");
      return;
    }

    setUploadProgress(0);
    setResult(null);

    try {
      const res = await uploadDataset({
        name: datasetName.trim(),
        file: selectedFile,
        onProgress: (pct) => setUploadProgress(pct),
      });

      setResult({
        success: res._success,
        datasetId: res.datasetId,
        qualityPercentage: res.qualityPercentage,
        hash: res.hash,
        message: res.message,
      });

      if (res._success) {
        toast.success("Dataset verified and stored on-chain");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
      setResult({
        success: false,
        qualityPercentage: 0,
        hash: "",
        message: msg,
      });
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setDatasetName("");
    setResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
          CSV files are validated for quality, hashed, and stored on-chain
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
            disabled={isPending}
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
            ${isPending ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
          `}
        >
          <div className="absolute inset-0 bg-grid-pattern rounded-lg opacity-20 pointer-events-none" />
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
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

        {/* Upload Progress */}
        <AnimatePresence>
          {isPending && (
            <motion.div
              data-ocid="upload.loading_state"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-xs font-mono text-muted-foreground">
                <span>Uploading to on-chain storage...</span>
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
            disabled={!selectedFile || !datasetName.trim() || isPending}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload & Validate
              </>
            )}
          </Button>
          {(selectedFile || result) && (
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={isPending}
              className="border-border"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className={`border rounded-lg p-6 space-y-4 ${
              result.success
                ? "bg-[oklch(0.68_0.18_152/0.08)] border-[oklch(0.68_0.18_152/0.3)]"
                : "bg-[oklch(0.60_0.22_25/0.08)] border-[oklch(0.60_0.22_25/0.3)]"
            }`}
            data-ocid={
              result.success ? "upload.success_state" : "upload.error_state"
            }
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-[oklch(0.75_0.18_152)] shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">
                  {result.message}
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
                    result.qualityPercentage >= 60
                      ? "text-[oklch(0.75_0.18_152)]"
                      : "text-destructive"
                  }
                >
                  {result.qualityPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.qualityPercentage}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    result.qualityPercentage >= 60
                      ? "bg-[oklch(0.68_0.18_152)]"
                      : "bg-destructive"
                  }`}
                />
              </div>
              {result.qualityPercentage < 60 && (
                <p className="text-xs text-muted-foreground">
                  Quality must be ≥ 60% to be accepted. Remove missing values,
                  nulls, and duplicates.
                </p>
              )}
            </div>

            {/* Hash */}
            {result.success && result.hash && (
              <HashDisplay hash={result.hash} label="On-chain Hash" />
            )}

            {/* Verification Badge */}
            {result.success && (
              <div className="flex items-center gap-2 py-2 px-3 rounded bg-[oklch(0.68_0.18_152/0.1)] border border-[oklch(0.68_0.18_152/0.3)]">
                <CheckCircle className="w-4 h-4 text-[oklch(0.75_0.18_152)]" />
                <span className="text-sm font-medium text-[oklch(0.75_0.18_152)]">
                  Dataset verified and stored on ICP blockchain
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
