import { Toaster } from "@/components/ui/sonner";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import type { Job } from "./backend.d";
import CompareSlider from "./components/CompareSlider";
import Header from "./components/Header";
import HistoryGallery from "./components/HistoryGallery";
import ProcessingQueue from "./components/ProcessingQueue";
import ProfileSetup from "./components/ProfileSetup";
import StatsBar from "./components/StatsBar";
import UploadPanel from "./components/UploadPanel";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerProfile } from "./hooks/useQueries";

export default function App() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const {
    data: profile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerProfile();
  const showProfileSetup =
    isAuthenticated && !profileLoading && profileFetched && profile === null;

  const [pollingJobIds, setPollingJobIds] = useState<string[]>([]);
  const [compareJob, setCompareJob] = useState<Job | null>(null);

  const handleJobsSubmitted = useCallback((jobIds: string[]) => {
    setPollingJobIds((prev) => [...new Set([...prev, ...jobIds])]);
  }, []);

  const handleJobComplete = useCallback((job: Job) => {
    setCompareJob(job);
    setPollingJobIds((prev) => prev.filter((id) => id !== job.id));
  }, []);

  const handleSelectJob = useCallback((job: Job) => {
    setCompareJob(job);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast: "bg-card border-border text-foreground font-sans",
            title: "text-foreground",
            description: "text-muted-foreground",
          },
        }}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Stats bar for authenticated users */}
        <AnimatePresence>
          {isAuthenticated && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <StatsBar />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left / main column */}
          <div className="xl:col-span-2 space-y-8">
            {/* Upload & Enhance Panel */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl">
                  <span className="gradient-text">Enhance Your Images</span>
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  AI-powered upscaling, restoration, colorization and more
                </p>
              </div>
              <UploadPanel onJobsSubmitted={handleJobsSubmitted} />
            </motion.section>

            {/* Processing Queue */}
            <AnimatePresence>
              {pollingJobIds.length > 0 && (
                <motion.section
                  key="queue"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="glass-card p-6"
                >
                  <ProcessingQueue
                    pollingJobIds={pollingJobIds}
                    onJobComplete={handleJobComplete}
                  />
                </motion.section>
              )}
            </AnimatePresence>

            {/* Before/After Comparison */}
            <AnimatePresence mode="wait">
              {compareJob && (
                <motion.section
                  key={compareJob.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CompareSlider job={compareJob} />
                </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Right column - Hero art */}
          <div className="xl:col-span-1 space-y-6">
            {/* Hero art */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card overflow-hidden"
            >
              <img
                src="/assets/generated/hero-upscaler.dim_800x400.jpg"
                alt="AI Upscaler"
                className="w-full object-cover opacity-90"
              />
              <div className="p-5">
                <h3 className="font-display font-bold text-lg gradient-text">
                  AI Models Powered By
                </h3>
                <div className="mt-3 space-y-2">
                  {[
                    { name: "Real-ESRGAN", desc: "Image upscaling up to 8×" },
                    { name: "SwinIR", desc: "Super-resolution transformer" },
                    { name: "LaMa", desc: "Large mask inpainting" },
                    { name: "DeOldify", desc: "Photo colorization" },
                    { name: "Stable Diffusion", desc: "Object removal" },
                  ].map((model) => (
                    <div
                      key={model.name}
                      className="flex items-center gap-3 py-1.5 border-b border-border/30 last:border-0"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-medium">
                          {model.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {model.desc}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* History Gallery - full width */}
        {isAuthenticated && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <HistoryGallery onSelectJob={handleSelectJob} />
          </motion.section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      {/* Profile setup modal */}
      <ProfileSetup open={showProfileSetup} />
    </div>
  );
}
