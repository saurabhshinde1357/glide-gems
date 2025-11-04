import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { generateDemoTransactions } from '@/utils/demoData';
import { Sparkles } from 'lucide-react';

export function DemoDataPrompt() {
  const { transactions, setTransactions } = useApp();
  const [open, setOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    // Only show once on first load if no transactions exist
    const hasSeenPrompt = localStorage.getItem('hasSeenDemoPrompt');
    
    if (!hasSeenPrompt && transactions.length === 0 && !hasChecked) {
      setOpen(true);
      setHasChecked(true);
      localStorage.setItem('hasSeenDemoPrompt', 'true');
    }
  }, [transactions.length, hasChecked]);

  const loadDemoData = () => {
    const demoTransactions = generateDemoTransactions();
    setTransactions(demoTransactions);
    setOpen(false);
  };

  const skipDemo = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Welcome to Budget Tracker!
          </DialogTitle>
          <DialogDescription>
            Would you like to load some demo transactions to explore the dashboard features?
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={loadDemoData} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Load Demo Data
          </Button>
          <Button variant="outline" onClick={skipDemo}>
            Start Fresh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
