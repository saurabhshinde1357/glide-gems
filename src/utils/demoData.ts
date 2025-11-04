import { Transaction } from '@/context/AppContext';

export function generateDemoTransactions(): Transaction[] {
  const categories = {
    expense: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare'],
    income: ['Salary', 'Freelance', 'Investment'],
  };

  const transactions: Transaction[] = [];
  const now = new Date();

  // Generate transactions for the last 3 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const transactionCount = 8 + Math.floor(Math.random() * 7); // 8-15 transactions per month

    for (let i = 0; i < transactionCount; i++) {
      const type = Math.random() > 0.7 ? 'income' : 'expense';
      const categoryList = categories[type];
      const category = categoryList[Math.floor(Math.random() * categoryList.length)];
      
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, Math.floor(Math.random() * 28) + 1);
      
      let amount: number;
      if (type === 'income') {
        amount = Math.floor(Math.random() * 3000) + 2000; // $2000-$5000
      } else {
        amount = Math.floor(Math.random() * 500) + 20; // $20-$520
      }

      transactions.push({
        id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${i}`,
        type,
        category,
        amount,
        date: date.toISOString().split('T')[0],
        description: `${type === 'income' ? 'Income from' : 'Expense for'} ${category}`,
        recurring: Math.random() > 0.8,
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
