import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency } from '@/utils/formatCurrency';
import { AddTransactionDialog } from '@/components/Transactions/AddTransactionDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Transactions() {
  const { transactions, deleteTransaction, settings } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    toast.success('Transaction deleted');
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">Transactions</h1>
          <p className="text-muted-foreground">{transactions.length} total transactions</p>
        </div>
        <AddTransactionDialog />
      </div>

      {/* Filters */}
      <div className="bg-card border border-card-border rounded-2xl p-4 mb-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No transactions found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchTerm || filterType !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first transaction to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="bg-card border border-card-border rounded-xl p-4 hover:shadow-md smooth-transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={transaction.type === 'income' ? 'default' : 'destructive'}
                      className={
                        transaction.type === 'income'
                          ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                          : 'bg-expense/10 text-expense border-expense/20 hover:bg-expense/20'
                      }
                    >
                      {transaction.type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{transaction.category}</span>
                  </div>
                  <p className="font-medium truncate">{transaction.description || 'No description'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xl font-bold ${
                      transaction.type === 'income' ? 'text-success' : 'text-expense'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount, settings.currency)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(transaction.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
