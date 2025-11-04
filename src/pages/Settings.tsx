import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState } from 'react';

export default function Settings() {
  const { settings, setSettings } = useApp();
  const [budget, setBudget] = useState(settings.monthlyBudget.toString());
  const [currency, setCurrency] = useState(settings.currency);

  const handleSave = () => {
    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setSettings({
      currency,
      monthlyBudget: budgetNum,
    });

    toast.success('Settings saved successfully');
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your budget preferences</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="INR">INR - Indian Rupee</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Monthly Budget</Label>
          <Input
            id="budget"
            type="number"
            step="100"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="5000"
          />
          <p className="text-xs text-muted-foreground">
            Set your monthly spending limit to track budget utilization
          </p>
        </div>

        <Button onClick={handleSave} className="w-full sm:w-auto">
          Save Settings
        </Button>
      </Card>
    </div>
  );
}
