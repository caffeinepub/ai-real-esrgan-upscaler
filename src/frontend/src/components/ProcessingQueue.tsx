import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import type { Job } from "../backend.d";
import { useActor } from "../hooks/useActor";
import ImageFromHash from "./ImageFromHash";

const ENHANCEMENT_LABELS: Record<string, string> = {
  upscale: "Real-ESRGAN",
  superres: "SwinIR",
  restore: "LaMa",
  colorize: "DeOldify",
  inpaint: "SD Inpaint",
};

const STATUS_PROGRESS: Record<string, number> = {
  pending: 15,
  processing: 55,
  done: 100,
  failed: 100,
};

interface ProcessingQueueProps {
  pollingJobIds: string[];
  onJobComplete: (job: Job) => void;
}

export default function ProcessingQueue({
  pollingJobIds,
  onJobComplete,
}: ProcessingQueueProps) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [loading, setLoading] = useState(false);

  const pollJobs = useCallback(async () => {
    if (!actor || pollingJobIds.length === 0) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        pollingJobIds.map((id) => actor.getJob(id)),
      );
      const newJobs: Record<string, Job> = {};
      for (const job of results) {
        if (job) newJobs[job.id] = job;
      }
      setJobs((prev) => {
        const merged = { ...prev, ...newJobs };
        for (const job of Object.values(newJobs)) {
          const prevJob = prev[job.id];
          if (job.status === "done" && prevJob?.status !== "done") {
            onJobComplete(job);
            qc.invalidateQueries({ queryKey: ["jobs"] });
          }
        }
        return merged;
      });
    } finally {
      setLoading(false);
    }
  }, [actor, pollingJobIds, onJobComplete, qc]);

  useEffect(() => {
    pollJobs();
    const interval = setInterval(pollJobs, 3000);
    return () => clearInterval(interval);
  }, [pollJobs]);

  const activeJobs = pollingJobIds
    .map((id) => jobs[id])
    .filter(Boolean)
    .filter((j) => j.status === "pending" || j.status === "processing");

  if (activeJobs.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="font-display font-semibold text-lg">Processing Queue</h2>
        {loading && (
          <Loader2
            className="w-4 h-4 animate-spin text-primary"
            data-ocid="queue.loading_state"
          />
        )}
        <Badge className="status-badge-processing ml-auto">
          {activeJobs.length} active
        </Badge>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {activeJobs.map((job, idx) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-4"
              data-ocid={`queue.item.${idx + 1}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border/50">
                  <ImageFromHash
                    hash={job.originalBlobId}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm truncate">
                      {ENHANCEMENT_LABELS[job.enhancementType] ??
                        job.enhancementType}
                      {job.enhancementType === "upscale" && (
                        <span className="text-primary ml-1">
                          {job.scale.toString()}×
                        </span>
                      )}
                    </span>
                    <Badge
                      className={`text-xs ml-auto flex-shrink-0 ${
                        job.status === "processing"
                          ? "status-badge-processing"
                          : job.status === "pending"
                            ? "status-badge-pending"
                            : ""
                      }`}
                    >
                      {job.status === "processing" ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Processing
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Queued
                        </>
                      )}
                    </Badge>
                  </div>

                  <Progress
                    value={STATUS_PROGRESS[job.status] ?? 0}
                    className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Job {job.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
