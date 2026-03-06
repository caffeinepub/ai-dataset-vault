import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialog as AlertDialogRoot,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  ChevronDown as ChevronDownIcon,
  Clock,
  Cpu,
  Database,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Dataset } from "../backend.d";
import { DatasetStatus } from "../backend.d";
import { ExternalTrainingModal } from "../components/ExternalTrainingModal";
import { HashDisplay } from "../components/HashDisplay";
import { StatusBadge } from "../components/StatusBadge";
import {
  useDatasets,
  useDeleteDataset,
  useTrainingUrl,
} from "../hooks/useQueries";

interface DatasetsPageProps {
  onTrainClick: (datasetId: bigint) => void;
}

export function DatasetsPage({ onTrainClick }: DatasetsPageProps) {
  const { data: datasets, isLoading } = useDatasets();
  const { mutateAsync: deleteDataset } = useDeleteDataset();
  const { data: trainingUrl } = useTrainingUrl();
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [externalModalDataset, setExternalModalDataset] =
    useState<Dataset | null>(null);
  const [externalModalOpen, setExternalModalOpen] = useState(false);

  const handleDelete = async (id: bigint) => {
    setDeletingId(id);
    try {
      await deleteDataset(id);
      toast.success("Dataset deleted");
    } catch {
      toast.error("Failed to delete dataset");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExternalTrain = (dataset: Dataset) => {
    const url = trainingUrl?.trim();
    if (!url) {
      toast.error("Set a training platform URL on the Training URL page first");
      return;
    }
    setExternalModalDataset(dataset);
    setExternalModalOpen(true);
  };

  const formatDate = (createdAt: bigint) => {
    const ms = Number(createdAt / BigInt(1_000_000));
    return new Date(ms).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold font-display text-foreground">
            My Datasets
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {datasets?.length ?? 0} datasets in vault
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          {!datasets || datasets.length === 0 ? (
            <div
              data-ocid="datasets.empty_state"
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="absolute inset-0 rounded-full ring-2 ring-border/50 animate-ping" />
              </div>
              <p className="text-foreground font-medium mb-1">
                No datasets yet
              </p>
              <p className="text-muted-foreground text-sm">
                Upload your first CSV dataset to begin
              </p>
            </div>
          ) : (
            <Table data-ocid="datasets.table">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
                    Name
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
                    Quality
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono hidden md:table-cell">
                    Created
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider font-mono text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((ds, idx) => (
                  <>
                    <TableRow
                      key={ds.id.toString()}
                      data-ocid={`datasets.row.${idx + 1}`}
                      className="border-border hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() =>
                        setExpandedId(expandedId === ds.id ? null : ds.id)
                      }
                    >
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {ds.name}
                          </span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${
                              expandedId === ds.id ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden hidden sm:block">
                            <div
                              className={`h-full rounded-full ${
                                ds.qualityPercentage >= 60
                                  ? "bg-[oklch(0.68_0.18_152)]"
                                  : "bg-destructive"
                              }`}
                              style={{ width: `${ds.qualityPercentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono text-muted-foreground">
                            {ds.qualityPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ds.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm font-mono hidden md:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(ds.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          {/* Train Model Dropdown */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={
                                        ds.status !== DatasetStatus.verified
                                      }
                                      className={`border-border text-xs h-7 px-2.5 gap-1 ${
                                        ds.status === DatasetStatus.verified
                                          ? "hover:border-primary/50 hover:text-primary"
                                          : "opacity-50"
                                      }`}
                                      data-ocid={`datasets.train_dropdown.${idx + 1}`}
                                    >
                                      <Cpu className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">
                                        Train Model
                                      </span>
                                      <ChevronDownIcon className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-popover border-border text-foreground w-52"
                                  >
                                    <DropdownMenuItem
                                      data-ocid={`datasets.train_inside_button.${idx + 1}`}
                                      className="flex items-center gap-2 cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                      onClick={() => onTrainClick(ds.id)}
                                    >
                                      <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <div>
                                        <p className="font-medium">
                                          Train Inside Platform
                                        </p>
                                        <p className="text-muted-foreground text-[10px]">
                                          SHA-256 integrity verified
                                        </p>
                                      </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-border" />
                                    <DropdownMenuItem
                                      data-ocid={`datasets.train_external_button.${idx + 1}`}
                                      className="flex items-center gap-2 cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                                      onClick={() => handleExternalTrain(ds)}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-[oklch(0.68_0.18_152)] shrink-0" />
                                      <div>
                                        <p className="font-medium">
                                          Train Using External Platform
                                        </p>
                                        <p className="text-muted-foreground text-[10px]">
                                          Opens in new tab
                                        </p>
                                      </div>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </span>
                            </TooltipTrigger>
                            {ds.status !== DatasetStatus.verified && (
                              <TooltipContent side="top" className="text-xs">
                                Dataset must be verified to train
                              </TooltipContent>
                            )}
                          </Tooltip>

                          <AlertDialogRoot>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-border text-xs h-7 px-2 hover:border-destructive/50 hover:text-destructive"
                                data-ocid={`datasets.delete_button.${idx + 1}`}
                              >
                                {deletingId === ds.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground font-display">
                                  Delete Dataset
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Permanently delete{" "}
                                  <strong className="text-foreground">
                                    {ds.name}
                                  </strong>
                                  ? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  className="border-border"
                                  data-ocid="datasets.cancel_button"
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(ds.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-ocid="datasets.confirm_button"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialogRoot>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded row with hash */}
                    <AnimatePresence>
                      {expandedId === ds.id && (
                        <TableRow
                          key={`${ds.id.toString()}-expanded`}
                          className="border-border bg-muted/10"
                        >
                          <TableCell colSpan={5} className="py-3 px-4">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <HashDisplay
                                hash={ds.hash}
                                label="On-chain Hash"
                              />
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </motion.div>
      </div>
      {/* External Training Verification Modal */}
      <ExternalTrainingModal
        dataset={externalModalDataset}
        trainingUrl={trainingUrl ?? ""}
        open={externalModalOpen}
        onOpenChange={setExternalModalOpen}
      />
    </TooltipProvider>
  );
}
