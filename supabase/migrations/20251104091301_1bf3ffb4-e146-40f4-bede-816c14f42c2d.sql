-- Create profiles table (user settings and preferences)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  currency TEXT DEFAULT 'USD' NOT NULL,
  monthly_budget NUMERIC DEFAULT 0 NOT NULL,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON public.transactions(category);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  current_progress NUMERIC DEFAULT 0 NOT NULL CHECK (current_progress >= 0),
  target_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create ai_sessions table
CREATE TABLE public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  session_type TEXT DEFAULT 'general' CHECK (session_type IN ('general', 'insights', 'forecast', 'optimization')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for goals
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON public.goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for ai_sessions
CREATE POLICY "Users can view own ai_sessions"
  ON public.ai_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_sessions"
  ON public.ai_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_goals
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC: Get monthly summary
CREATE OR REPLACE FUNCTION public.get_monthly_summary(
  target_month DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  user_budget NUMERIC;
BEGIN
  -- Get user's monthly budget
  SELECT monthly_budget INTO user_budget
  FROM public.profiles
  WHERE id = auth.uid();

  SELECT json_build_object(
    'total_income', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0),
    'total_expenses', COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0),
    'net_savings', COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0),
    'budget', COALESCE(user_budget, 0),
    'budget_utilization', CASE 
      WHEN COALESCE(user_budget, 0) > 0 
      THEN (COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) / user_budget * 100)
      ELSE 0 
    END,
    'transaction_count', COUNT(*)
  ) INTO result
  FROM public.transactions
  WHERE user_id = auth.uid()
    AND DATE_TRUNC('month', date) = DATE_TRUNC('month', target_month);

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Get category breakdown
CREATE OR REPLACE FUNCTION public.get_category_breakdown(
  target_month DATE DEFAULT CURRENT_DATE
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'category', category,
        'total', total_amount,
        'percentage', ROUND((total_amount / NULLIF(sum_total, 0) * 100)::numeric, 2),
        'transaction_count', transaction_count
      )
    )
    FROM (
      SELECT 
        category,
        SUM(amount) as total_amount,
        COUNT(*) as transaction_count,
        SUM(SUM(amount)) OVER () as sum_total
      FROM public.transactions
      WHERE user_id = auth.uid()
        AND type = 'expense'
        AND DATE_TRUNC('month', date) = DATE_TRUNC('month', target_month)
      GROUP BY category
      ORDER BY total_amount DESC
    ) subquery
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Get trendline data (last 6 months)
CREATE OR REPLACE FUNCTION public.get_trendline_data()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'month', TO_CHAR(month, 'Mon YYYY'),
        'income', COALESCE(income, 0),
        'expenses', COALESCE(expenses, 0),
        'savings', COALESCE(income, 0) - COALESCE(expenses, 0)
      )
      ORDER BY month DESC
    )
    FROM (
      SELECT 
        DATE_TRUNC('month', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM public.transactions
      WHERE user_id = auth.uid()
        AND date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', date)
    ) monthly_data
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable Realtime for transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;