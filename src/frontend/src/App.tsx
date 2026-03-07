import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Cpu,
  Database,
  FileText,
  LayoutDashboard,
  Link,
  Loader2,
  LogIn,
  LogOut,
  Menu,
  Shield,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AuditLogPage } from "./pages/AuditLogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DatasetsPage } from "./pages/DatasetsPage";
import { TrainPage } from "./pages/TrainPage";
import { TrainingUrlPage } from "./pages/TrainingUrlPage";
import { UploadPage } from "./pages/UploadPage";

type Page =
  | "dashboard"
  | "upload"
  | "datasets"
  | "train"
  | "training-url"
  | "audit-log";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: "upload",
    label: "Upload Dataset",
    icon: <Upload className="w-4 h-4" />,
  },
  {
    id: "datasets",
    label: "My Datasets",
    icon: <Database className="w-4 h-4" />,
  },
  { id: "train", label: "Train Model", icon: <Cpu className="w-4 h-4" /> },
  {
    id: "training-url",
    label: "Training URL",
    icon: <Link className="w-4 h-4" />,
  },
  {
    id: "audit-log",
    label: "Audit Log",
    icon: <FileText className="w-4 h-4" />,
  },
];

function getOcid(id: Page): string {
  switch (id) {
    case "dashboard":
      return "nav.dashboard_link";
    case "upload":
      return "nav.upload_button";
    case "datasets":
      return "nav.datasets_link";
    case "train":
      return "nav.train_link";
    case "training-url":
      return "nav.training_url_link";
    case "audit-log":
      return "nav.audit_log_link";
  }
}

function LoginGate() {
  const { login, isLoggingIn } = useInternetIdentity();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full text-center space-y-8"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center shadow-glow-sm">
              <Shield className="w-10 h-10 text-primary text-glow-cyan" />
            </div>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">
              SecureChain AI
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              AI-validated, blockchain-secured dataset management
            </p>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.68_0.18_152)] shrink-0" />
            <span>SHA-256 integrity hashing for every dataset</span>
          </div>
          <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border">
            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span>On-chain storage on the Internet Computer</span>
          </div>
          <div className="flex items-center gap-3 py-3 px-4 rounded-lg bg-card border border-border">
            <div className="w-2 h-2 rounded-full bg-[oklch(0.75_0.18_60)] shrink-0" />
            <span>Automatic quality validation (≥60% required)</span>
          </div>
        </div>

        <Button
          data-ocid="auth.login_button"
          onClick={login}
          disabled={isLoggingIn}
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-base shadow-glow-sm"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Sign In to SecureChain AI
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}

export default function App() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [trainDatasetId, setTrainDatasetId] = useState<bigint | null>(null);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="w-10 h-10 text-primary animate-pulse text-glow-cyan" />
          <span className="text-muted-foreground text-sm font-mono">
            Initializing SecureChain AI...
          </span>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <>
        <LoginGate />
        <Toaster />
      </>
    );
  }

  const handleTrainClick = (datasetId: bigint) => {
    setTrainDatasetId(datasetId);
    setCurrentPage("train");
  };

  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
    if (page !== "train") setTrainDatasetId(null);
  };

  const visibleNavItems = navItems;
  const principalStr = identity.getPrincipal().toString();
  const shortPrincipal = `${principalStr.slice(0, 5)}...${principalStr.slice(-4)}`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 lg:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary text-glow-cyan" />
            </div>
            <span className="font-bold font-display text-foreground text-sm hidden sm:block">
              SecureChain AI
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleNavItems.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                data-ocid={getOcid(item.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all
                  ${
                    currentPage === item.id
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Principal Badge */}
            <span className="hidden sm:block text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border">
              {shortPrincipal}
            </span>

            <Button
              data-ocid="auth.logout_button"
              size="sm"
              variant="outline"
              onClick={clear}
              className="border-border text-muted-foreground hover:text-foreground h-8 px-3 text-xs"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              <span className="hidden sm:block">Sign Out</span>
            </Button>

            {/* Mobile Menu Toggle */}
            <Button
              size="sm"
              variant="ghost"
              className="lg:hidden h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-border bg-card px-4 py-2 overflow-hidden"
            >
              {visibleNavItems.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  data-ocid={getOcid(item.id)}
                  className={`
                    flex items-center gap-2 w-full px-3 py-2.5 rounded text-sm font-medium transition-all mb-1
                    ${
                      currentPage === item.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }
                  `}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 max-w-5xl w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {currentPage === "dashboard" && <DashboardPage />}
            {currentPage === "upload" && <UploadPage />}
            {currentPage === "datasets" && (
              <DatasetsPage onTrainClick={handleTrainClick} />
            )}
            {currentPage === "train" && (
              <TrainPage preselectedDatasetId={trainDatasetId} />
            )}
            {currentPage === "training-url" && <TrainingUrlPage />}
            {currentPage === "audit-log" && <AuditLogPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
