import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

export function AIInsights() {
  const { transactions, settings } = useApp();
  const [insights, setInsights] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchInsights = async () => {
    if (transactions.length === 0) {
      setInsights('💡 Add some transactions to get personalized AI insights about your spending!');
      return;
    }

    setIsLoading(true);
    try {
      const recentTransactions = transactions.slice(0, 20);
      
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          transactions: recentTransactions,
          budget: settings.monthlyBudget,
          type: 'insights',
        },
      });

      if (error) throw error;
      setInsights(data.content);
    } catch (error: any) {
      console.error('AI insights error:', error);
      toast.error(error.message || 'Failed to fetch AI insights');
      setInsights('⚠️ Unable to fetch insights. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []); // Only fetch once on mount

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Financial Insights</h3>
              <p className="text-xs text-muted-foreground">
                Powered by AI analysis
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchInsights}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your financial data...
            </div>
          ) : (
            insights
          )}
        </div>
      </Card>
    </motion.div>
  );
}
