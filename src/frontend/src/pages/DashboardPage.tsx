import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { DatasetStatus } from "../backend.d";
import { useDatasets } from "../hooks/useQueries";

function StatCard({
  icon,
  label,
  value,
  colorClass,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  colorClass: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden bg-card border border-border rounded-lg p-5 group hover:border-primary/30 transition-colors"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono mb-2">
            {label}
          </p>
          <p className={`text-4xl font-bold font-display ${colorClass}`}>
            {value}
          </p>
        </div>
        <div className={`p-2 rounded-md bg-muted/50 ${colorClass}`}>{icon}</div>
      </div>
    </motion.div>
  );
}

export function DashboardPage() {
  const { data: datasets, isLoading } = useDatasets();

  const total = datasets?.length ?? 0;
  const verified =
    datasets?.filter((d) => d.status === DatasetStatus.verified).length ?? 0;
  const rejected =
    datasets?.filter((d) => d.status === DatasetStatus.rejected).length ?? 0;
  const compromised =
    datasets?.filter((d) => d.status === DatasetStatus.compromised).length ?? 0;

  const avgQuality =
    datasets && datasets.length > 0
      ? Math.round(
          datasets.reduce((sum, d) => sum + d.qualityPercentage, 0) /
            datasets.length,
        )
      : 0;

  const recentDatasets = datasets
    ? [...datasets]
        .sort((a, b) => Number(b.createdAt - a.createdAt))
        .slice(0, 5)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {["total", "verified", "rejected", "compromised"].map((k) => (
            <Skeleton key={k} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
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
        <h1 className="text-2xl font-bold font-display text-foreground">
          Vault Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor dataset integrity and training readiness
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Database className="w-5 h-5" />}
          label="Total Datasets"
          value={total}
          colorClass="text-primary"
          delay={0}
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Verified"
          value={verified}
          colorClass="text-[oklch(0.75_0.18_152)]"
          delay={0.05}
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label="Rejected"
          value={rejected}
          colorClass="text-destructive"
          delay={0.1}
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Compromised"
          value={compromised}
          colorClass="text-[oklch(0.75_0.18_60)]"
          delay={0.15}
        />
      </div>

      {/* Quality Average */}
      {datasets && datasets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border rounded-lg p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Average Dataset Quality
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold font-display text-primary text-glow-cyan">
              {avgQuality}%
            </span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${avgQuality}%` }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Recent Datasets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-card border border-border rounded-lg p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Recent Uploads
          </span>
        </div>

        {recentDatasets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No datasets uploaded yet. Upload your first dataset to get started.
          </div>
        ) : (
          <div className="space-y-2">
            {recentDatasets.map((ds, idx) => (
              <motion.div
                key={ds.id.toString()}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                className="flex items-center justify-between py-2.5 px-3 rounded bg-muted/30 border border-border/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Database className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {ds.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-muted-foreground">
                    {ds.qualityPercentage.toFixed(1)}%
                  </span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full border ${
                      ds.status === DatasetStatus.verified
                        ? "status-verified"
                        : ds.status === DatasetStatus.compromised
                          ? "status-compromised"
                          : "status-rejected"
                    }`}
                  >
                    {ds.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
