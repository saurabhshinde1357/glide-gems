import { createContext, useContext } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useProfile } from '@/hooks/useProfile';

interface DatabaseContextType {
  transactions: ReturnType<typeof useTransactions>;
  profile: ReturnType<typeof useProfile>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const transactions = useTransactions();
  const profile = useProfile();

  return (
    <DatabaseContext.Provider value={{ transactions, profile }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}
