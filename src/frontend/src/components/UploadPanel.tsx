import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Eraser,
  ImageIcon,
  Loader2,
  Palette,
  Sparkles,
  Upload,
  Wand2,
  X,
  ZoomIn,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSubmitJob } from "../hooks/useQueries";
import { useStorage } from "../hooks/useStorage";

const ENHANCEMENT_TYPES = [
  {
    id: "upscale",
    label: "Real-ESRGAN Upscale",
    desc: "2x, 4x, or 8x resolution",
    icon: ZoomIn,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "superres",
    label: "SwinIR Super-Res",
    desc: "AI super resolution",
    icon: Sparkles,
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    id: "restore",
    label: "LaMa Restoration",
    desc: "Fix damaged areas",
    icon: Wand2,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    id: "colorize",
    label: "DeOldify Colorize",
    desc: "Colorize B&W photos",
    icon: Palette,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    id: "inpaint",
    label: "SD Inpainting",
    desc: "Remove objects",
    icon: Eraser,
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
] as const;

const SCALES = [2, 4, 8] as const;

interface UploadPanelProps {
  onJobsSubmitted: (jobIds: string[]) => void;
}

export default function UploadPanel({ onJobsSubmitted }: UploadPanelProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [enhancementType, setEnhancementType] = useState<string>("upscale");
  const [scale, setScale] = useState<number>(4);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const { uploadFile } = useStorage();
  const submitJob = useSubmitJob();

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const valid = Array.from(newFiles).filter((f) =>
      ["image/png", "image/jpeg", "image/webp"].includes(f.type),
    );
    if (valid.length === 0) {
      toast.error("Please upload PNG, JPG, or WEBP images");
      return;
    }
    setFiles((prev) => [...prev, ...valid]);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || files.length === 0) return;
    setIsSubmitting(true);
    const jobIds: string[] = [];

    try {
      await Promise.all(
        files.map(async (file) => {
          const hash = await uploadFile(file, (pct) => {
            setUploadProgress((prev) => ({ ...prev, [file.name]: pct }));
          });
          toast.success(`Uploaded ${file.name}`);
          const jobId = await submitJob.mutateAsync({
            originalBlobId: hash,
            enhancementType,
            scale: BigInt(scale),
          });
          jobIds.push(jobId);
        }),
      );
      toast.success(`${jobIds.length} job(s) submitted!`);
      setFiles([]);
      setUploadProgress({});
      onJobsSubmitted(jobIds);
    } catch (err: any) {
      toast.error(err?.message ?? "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl transition-all duration-300 cursor-pointer",
          isDragOver
            ? "border-primary dropzone-active"
            : "border-border/50 hover:border-primary/50",
          files.length > 0 ? "p-4" : "p-12",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        data-ocid="upload.dropzone"
        aria-label="Drop zone for image upload"
        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          data-ocid="upload.upload_button"
        />

        <AnimatePresence mode="wait">
          {files.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center">
                <Upload className="w-9 h-9 text-primary" />
              </div>
              <div>
                <p className="font-display font-semibold text-lg text-foreground">
                  Drop images here or{" "}
                  <span className="text-primary underline underline-offset-2">
                    browse
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  PNG, JPG, WEBP · Batch upload supported
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="files"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                  {files.length} file{files.length !== 1 ? "s" : ""} selected
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  + Add more
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {files.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border/50">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                      {uploadProgress[file.name] !== undefined && (
                        <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center gap-1 p-2">
                          <Progress
                            value={uploadProgress[file.name]}
                            className="w-full h-1"
                          />
                          <span className="text-xs text-primary">
                            {uploadProgress[file.name]}%
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground truncate">
                      {file.name}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Enhancement Type Selector */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Enhancement Type
        </h3>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
          data-ocid="enhance.type.select"
        >
          {ENHANCEMENT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                type="button"
                key={type.id}
                className={cn(
                  "enhancement-card text-left",
                  enhancementType === type.id && "active",
                )}
                onClick={() => setEnhancementType(type.id)}
                aria-pressed={enhancementType === type.id}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                    type.bg,
                  )}
                >
                  <Icon className={cn("w-4 h-4", type.color)} />
                </div>
                <p className="font-medium text-sm leading-tight">
                  {type.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {type.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scale Selector (only for upscale) */}
      <AnimatePresence>
        {enhancementType === "upscale" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Scale Factor
            </h3>
            <div className="flex gap-3" data-ocid="enhance.scale.select">
              {SCALES.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={cn(
                    "flex-1 py-3 rounded-xl border font-mono font-bold text-lg transition-all duration-200",
                    scale === s
                      ? "border-primary bg-primary/15 text-primary neon-glow-cyan"
                      : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                  onClick={() => setScale(s)}
                  aria-pressed={scale === s}
                >
                  {s}×
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit */}
      {isAuthenticated ? (
        <Button
          type="button"
          className="w-full h-12 font-display font-semibold text-base bg-gradient-to-r from-primary to-accent text-primary-foreground neon-glow-cyan hover:opacity-90 transition-opacity"
          disabled={files.length === 0 || isSubmitting}
          onClick={handleSubmit}
          data-ocid="enhance.submit_button"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Enhance{" "}
              {files.length > 0
                ? `${files.length} Image${files.length !== 1 ? "s" : ""}`
                : "Images"}
            </>
          )}
        </Button>
      ) : (
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="font-display font-semibold">
              Connect to Start Enhancing
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect your wallet to upload and enhance images with AI
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
