import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AICategorization {
  description: string;
  onCategorySelect: (category: string) => void;
}

export function AICategorization({ description, onCategorySelect }: AICategorization) {
  const [isLoading, setIsLoading] = useState(false);

  const suggestCategory = async () => {
    if (!description.trim()) {
      toast.error('Please enter a description first');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: {
          transactions: description,
          type: 'categorize',
        },
      });

      if (error) throw error;
      
      const category = data.content.trim();
      onCategorySelect(category);
      toast.success(`AI suggested: ${category}`);
    } catch (error: any) {
      console.error('AI categorization error:', error);
      toast.error(error.message || 'Failed to get AI suggestion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={suggestCategory}
      disabled={isLoading || !description.trim()}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      AI Suggest
    </Button>
  );
}
