import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'success' | 'expense';
  delay?: number;
}

export function MetricCard({ title, value, icon: Icon, trend, variant = 'default', delay = 0 }: MetricCardProps) {
  const variantStyles = {
    default: 'from-primary/10 to-primary/5 border-primary/20',
    success: 'from-success/10 to-success/5 border-success/20',
    expense: 'from-expense/10 to-expense/5 border-expense/20',
  };

  const iconStyles = {
    default: 'text-primary bg-primary/10',
    success: 'text-success bg-success/10',
    expense: 'text-expense bg-expense/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={`metric-card bg-gradient-to-br ${variantStyles[variant]} border`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          {trend && (
            <p className="text-xs text-muted-foreground mt-2">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
