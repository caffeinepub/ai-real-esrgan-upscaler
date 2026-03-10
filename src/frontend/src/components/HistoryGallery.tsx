import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Download, ImageIcon, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Job } from "../backend.d";
import { useDeleteJob, useListMyJobs } from "../hooks/useQueries";
import { getStorageClientInstance } from "../utils/storageHelpers";
import ImageFromHash from "./ImageFromHash";

const ENHANCEMENT_COLORS: Record<string, string> = {
  upscale: "status-badge-processing",
  superres: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  restore: "bg-green-500/20 text-green-400 border border-green-500/30",
  colorize: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  inpaint: "bg-pink-500/20 text-pink-400 border border-pink-500/30",
};

const ENHANCEMENT_LABELS: Record<string, string> = {
  upscale: "Upscale",
  superres: "SwinIR",
  restore: "Restore",
  colorize: "Colorize",
  inpaint: "Inpaint",
};

interface HistoryGalleryProps {
  onSelectJob: (job: Job) => void;
}

export default function HistoryGallery({ onSelectJob }: HistoryGalleryProps) {
  const { data: allJobs, isLoading } = useListMyJobs();
  const deleteJob = useDeleteJob();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const doneJobs = (allJobs ?? []).filter((j) => j.status === "done");
  const failedJobs = (allJobs ?? []).filter((j) => j.status === "failed");
  const displayJobs = [...doneJobs, ...failedJobs].sort(
    (a, b) => Number(b.updatedAt) - Number(a.updatedAt),
  );

  const handleDelete = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      await deleteJob.mutateAsync(jobId);
      toast.success("Job deleted");
    } catch {
      toast.error("Failed to delete job");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (job: Job) => {
    if (!job.resultBlobId) return;
    try {
      const client = await getStorageClientInstance();
      const url = await client.getDirectURL(job.resultBlobId);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enhanced-${job.id.slice(0, 8)}.jpg`;
      a.click();
    } catch {
      toast.error("Download failed");
    }
  };

  const formatDate = (ts: bigint) => {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(Number(ts / 1_000_000n)));
  };

  return (
    <div className="space-y-4" data-ocid="history.panel">
      <div className="flex items-center gap-3">
        <h2 className="font-display font-semibold text-lg">History Gallery</h2>
        {displayJobs.length > 0 && (
          <Badge variant="outline" className="text-xs border-border/60">
            {doneJobs.length} completed
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-square rounded-xl shimmer" />
          ))}
        </div>
      ) : displayJobs.length === 0 ? (
        <div
          className="glass-card p-12 text-center space-y-4"
          data-ocid="history.empty_state"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto border border-border/50">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold text-lg">
              No enhanced images yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Upload and enhance your first image above
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence>
            {displayJobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
                className="group glass-card overflow-hidden hover:border-primary/40 transition-all cursor-pointer"
                data-ocid={`history.item.${idx + 1}`}
                onClick={() => job.status === "done" && onSelectJob(job)}
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {job.status === "done" && job.resultBlobId ? (
                    <ImageFromHash
                      hash={job.resultBlobId}
                      alt="Enhanced result"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : job.status === "failed" ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-4">
                        <p className="text-destructive text-xs font-medium">
                          Failed
                        </p>
                        {job.errorMessage && (
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                            {job.errorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full shimmer" />
                  )}

                  {/* Overlay on hover */}
                  {job.status === "done" && (
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-xs font-medium text-primary">
                        View comparison
                      </p>
                    </div>
                  )}
                </div>

                {/* Card footer */}
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={`text-xs py-0 ${ENHANCEMENT_COLORS[job.enhancementType] ?? ""}`}
                    >
                      {ENHANCEMENT_LABELS[job.enhancementType] ??
                        job.enhancementType}
                      {job.enhancementType === "upscale" && ` ${job.scale}×`}
                    </Badge>
                    {job.status === "failed" && (
                      <Badge className="status-badge-failed text-xs py-0">
                        Failed
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {formatDate(job.updatedAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    {job.status === "done" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-1 h-7 text-xs hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(job);
                        }}
                        data-ocid={`history.item.${idx + 1}`}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                          data-ocid={`history.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-card border-border/60">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This will permanently remove the job and its
                            results.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-ocid="history.cancel_button">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground"
                            onClick={() => handleDelete(job.id)}
                            data-ocid="history.confirm_button"
                          >
                            {deletingId === job.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
