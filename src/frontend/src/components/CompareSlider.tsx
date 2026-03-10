import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, CheckCircle2, Download } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Job } from "../backend.d";
import { getStorageClientInstance } from "../utils/storageHelpers";

const ENHANCEMENT_LABELS: Record<string, string> = {
  upscale: "Real-ESRGAN Upscale",
  superres: "SwinIR Super-Res",
  restore: "LaMa Restore",
  colorize: "DeOldify Colorize",
  inpaint: "SD Inpainting",
};

interface CompareSliderProps {
  job: Job;
}

export default function CompareSlider({ job }: CompareSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!job.originalBlobId) return;
    getStorageClientInstance()
      .then((c) => c.getDirectURL(job.originalBlobId))
      .then(setOriginalUrl);
  }, [job.originalBlobId]);

  useEffect(() => {
    if (!job.resultBlobId) return;
    getStorageClientInstance()
      .then((c) => c.getDirectURL(job.resultBlobId!))
      .then(setResultUrl);
  }, [job.resultBlobId]);

  const updateSlider = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      updateSlider(e.clientX);
    },
    [isDragging, updateSlider],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      updateSlider(e.touches[0].clientX);
    },
    [isDragging, updateSlider],
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", () => setIsDragging(false));
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", () => setIsDragging(false));
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", () => setIsDragging(false));
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", () => setIsDragging(false));
    };
  }, [isDragging, handleMouseMove, handleTouchMove]);

  const handleDownload = async () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `enhanced-${job.id.slice(0, 8)}.jpg`;
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
      data-ocid="compare.panel"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm">
            {ENHANCEMENT_LABELS[job.enhancementType] ?? job.enhancementType}
            {job.enhancementType === "upscale" && (
              <span className="text-primary ml-1">{job.scale.toString()}×</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Enhancement complete · Drag to compare
          </p>
        </div>
        <Badge className="status-badge-done text-xs">Done</Badge>
        <Button
          size="sm"
          className="bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 gap-1.5"
          onClick={handleDownload}
          data-ocid="compare.download_button"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </Button>
      </div>

      {/* Slider area */}
      <div
        ref={containerRef}
        className="relative aspect-[16/9] overflow-hidden select-none cursor-col-resize bg-muted"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
          updateSlider(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          updateSlider(e.touches[0].clientX);
        }}
      >
        {/* Original (left) */}
        {originalUrl ? (
          <img
            src={originalUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 shimmer" />
        )}

        {/* Result (right, clipped) */}
        {resultUrl && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <img
              src={resultUrl}
              alt="Enhanced"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        )}

        {/* Labels */}
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <span className="px-2 py-1 rounded text-xs font-mono bg-black/60 text-white/80">
            ORIGINAL
          </span>
        </div>
        <div className="absolute bottom-3 right-3 pointer-events-none">
          <span className="px-2 py-1 rounded text-xs font-mono bg-primary/60 text-primary-foreground">
            ENHANCED
          </span>
        </div>

        {/* Divider handle */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/80 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center"
            style={{
              boxShadow:
                "0 0 0 3px oklch(0.78 0.175 195), 0 0 20px oklch(0.78 0.175 195 / 0.6)",
            }}
          >
            <ArrowLeftRight className="w-5 h-5 text-gray-800" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
