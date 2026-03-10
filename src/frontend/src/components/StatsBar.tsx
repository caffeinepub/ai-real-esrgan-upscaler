import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle2, TrendingUp, XCircle } from "lucide-react";
import { motion } from "motion/react";
import { useGetStats } from "../hooks/useQueries";

export default function StatsBar() {
  const { data: stats, isLoading } = useGetStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
      data-ocid="stats.panel"
    >
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wider">
          Platform Stats
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatItem
          icon={TrendingUp}
          label="Total Jobs"
          value={stats?.totalJobs}
          isLoading={isLoading}
          iconClass="text-primary"
          bgClass="bg-primary/10"
        />
        <StatItem
          icon={CheckCircle2}
          label="Completed"
          value={stats?.completedJobs}
          isLoading={isLoading}
          iconClass="text-green-400"
          bgClass="bg-green-500/10"
        />
        <StatItem
          icon={XCircle}
          label="Failed"
          value={stats?.failedJobs}
          isLoading={isLoading}
          iconClass="text-destructive"
          bgClass="bg-destructive/10"
        />
      </div>
    </motion.div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
  isLoading,
  iconClass,
  bgClass,
}: {
  icon: any;
  label: string;
  value: bigint | undefined;
  isLoading: boolean;
  iconClass: string;
  bgClass: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bgClass}`}
      >
        <Icon className={`w-4 h-4 ${iconClass}`} />
      </div>
      <div>
        {isLoading ? (
          <Skeleton className="h-5 w-12 mb-1" />
        ) : (
          <p className="font-mono font-bold text-base leading-tight">
            {value?.toString() ?? "—"}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
