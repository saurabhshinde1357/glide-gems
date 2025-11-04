import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TrendChartProps {
  data: { month: string; income: number; expenses: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="chart-container"
    >
      <h3 className="text-lg font-semibold mb-4">6-Month Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="month"
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip
            formatter={(value: number) => `$${value.toFixed(0)}`}
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="hsl(var(--success))"
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--success))', r: 4 }}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="hsl(var(--expense))"
            strokeWidth={3}
            dot={{ fill: 'hsl(var(--expense))', r: 4 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
