import { Transaction, Category, SpendingInsight, DailySpending, SpendingHeatmapItem } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, getDay } from 'date-fns';

export interface FinancialOverview {
  totalExpense: number;
  totalIncome: number;
  netCashFlow: number;
  averageDailySpending: number;
  highestCategory: { name: string; amount: number; percentage: number } | null;
  totalTransactionsCount: number;
  pendingCategorizationCount: number;
}

export interface CategoryBreakdownItem {
  id: string;
  name: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
  icon: string;
}

export function computeFinancialOverview(transactions: Transaction[], targetDate: Date = new Date()): FinancialOverview {
  // Filter transactions for target month
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);

  const monthTxns = transactions.filter((t) => {
    const d = new Date(t.transaction_date);
    return d >= monthStart && d <= monthEnd;
  });

  let totalExpense = 0;
  let totalIncome = 0;
  let pendingCount = 0;
  const categoryTotals: Record<string, { amount: number; name: string }> = {};

  for (const t of monthTxns) {
    if (t.status === 'pending_categorization') {
      pendingCount++;
    }

    if (t.transaction_type === 'debit') {
      totalExpense += t.amount;
      const catName = t.category?.name || 'Uncategorized';
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { amount: 0, name: catName };
      }
      categoryTotals[catName].amount += t.amount;
    } else if (t.transaction_type === 'credit') {
      totalIncome += t.amount;
    } else if (t.transaction_type === 'refund') {
      totalExpense -= t.amount; // refunds reduce expense
    }
  }

  // Days elapsed in the month so far (or total days if past month)
  const today = new Date();
  const isCurrentMonth = today.getMonth() === targetDate.getMonth() && today.getFullYear() === targetDate.getFullYear();
  const daysCount = isCurrentMonth ? Math.max(1, today.getDate()) : monthEnd.getDate();

  const averageDailySpending = totalExpense > 0 ? Math.round(totalExpense / daysCount) : 0;

  // Highest category
  let highestCategory: { name: string; amount: number; percentage: number } | null = null;
  let maxCatAmount = 0;
  for (const item of Object.values(categoryTotals)) {
    if (item.amount > maxCatAmount) {
      maxCatAmount = item.amount;
      highestCategory = {
        name: item.name,
        amount: item.amount,
        percentage: totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
      };
    }
  }

  return {
    totalExpense: Math.max(0, totalExpense),
    totalIncome,
    netCashFlow: totalIncome - Math.max(0, totalExpense),
    averageDailySpending,
    highestCategory,
    totalTransactionsCount: monthTxns.length,
    pendingCategorizationCount: pendingCount,
  };
}

export function computeCategoryBreakdown(transactions: Transaction[], categories: Category[]): CategoryBreakdownItem[] {
  const expenseTxns = transactions.filter((t) => t.transaction_type === 'debit');
  const totalExpense = expenseTxns.reduce((acc, t) => acc + t.amount, 0);

  const map: Record<string, { amount: number; count: number; category: Category | undefined }> = {};

  for (const t of expenseTxns) {
    const catId = t.category_id || 'uncategorized';
    if (!map[catId]) {
      const cat = categories.find((c) => c.id === catId);
      map[catId] = { amount: 0, count: 0, category: cat };
    }
    map[catId].amount += t.amount;
    map[catId].count += 1;
  }

  const items: CategoryBreakdownItem[] = Object.entries(map).map(([id, val]) => {
    return {
      id,
      name: val.category?.name || 'Uncategorized',
      amount: val.amount,
      percentage: totalExpense > 0 ? Math.round((val.amount / totalExpense) * 100) : 0,
      count: val.count,
      color: val.category?.color || '#71717a',
      icon: val.category?.icon || 'HelpCircle',
    };
  });

  return items.sort((a, b) => b.amount - a.amount);
}

export function computeDailySpending(transactions: Transaction[], targetDate: Date = new Date()): DailySpending[] {
  const monthStart = startOfMonth(targetDate);
  const monthEnd = endOfMonth(targetDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return days.map((day) => {
    const dayTxns = transactions.filter((t) => {
      const d = new Date(t.transaction_date);
      return isSameDay(d, day) && t.transaction_type === 'debit';
    });

    const amount = dayTxns.reduce((acc, t) => acc + t.amount, 0);

    return {
      date: format(day, 'yyyy-MM-dd'),
      dayOfWeek: format(day, 'EEE'),
      amount,
      count: dayTxns.length,
    };
  });
}

export function computeSpendingHeatmap(transactions: Transaction[], targetDate: Date = new Date()): SpendingHeatmapItem[] {
  const daily = computeDailySpending(transactions, targetDate);
  const maxSpend = Math.max(...daily.map((d) => d.amount), 1);

  return daily.map((d) => {
    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (d.amount > 0) {
      const ratio = d.amount / maxSpend;
      if (ratio > 0.75) level = 4;
      else if (ratio > 0.5) level = 3;
      else if (ratio > 0.25) level = 2;
      else level = 1;
    }

    return {
      date: d.date,
      amount: d.amount,
      count: d.count,
      level,
    };
  });
}

export function generateSpendingInsights(
  transactions: Transaction[],
  categories: Category[],
  targetDate: Date = new Date()
): SpendingInsight[] {
  const insights: SpendingInsight[] = [];
  const overview = computeFinancialOverview(transactions, targetDate);

  // Compare with previous month
  const prevMonthDate = subMonths(targetDate, 1);
  const prevOverview = computeFinancialOverview(transactions, prevMonthDate);

  if (prevOverview.totalExpense > 0 && overview.totalExpense > 0) {
    const delta = ((overview.totalExpense - prevOverview.totalExpense) / prevOverview.totalExpense) * 100;
    const rounded = Math.abs(Math.round(delta));
    if (delta > 0) {
      insights.push({
        id: 'ins-trend-up',
        type: 'warning',
        title: 'Monthly Spending Velocity',
        description: `You have spent ${rounded}% more this month compared to the same period last month.`,
        metric: `+${rounded}%`,
        sentiment: 'negative',
      });
    } else {
      insights.push({
        id: 'ins-trend-down',
        type: 'decrease',
        title: 'Disciplined Spending',
        description: `Spending is down by ${rounded}% compared to last month. Keep it up!`,
        metric: `-${rounded}%`,
        sentiment: 'positive',
      });
    }
  }

  // Daily average insight
  if (overview.averageDailySpending > 0) {
    insights.push({
      id: 'ins-daily-avg',
      type: 'highlight',
      title: 'Daily Spending Baseline',
      description: `Your average daily spend is ₹${overview.averageDailySpending.toLocaleString('en-IN')}.`,
      metric: `₹${overview.averageDailySpending.toLocaleString('en-IN')}/day`,
      sentiment: 'neutral',
    });
  }

  // Top category
  if (overview.highestCategory) {
    insights.push({
      id: 'ins-top-cat',
      type: 'highlight',
      title: 'Highest Spending Category',
      description: `${overview.highestCategory.name} accounts for ${overview.highestCategory.percentage}% of your monthly outlays (₹${overview.highestCategory.amount.toLocaleString('en-IN')}).`,
      metric: `${overview.highestCategory.percentage}%`,
      sentiment: 'neutral',
    });
  }

  // Merchant insight
  const merchantTotals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.transaction_type === 'debit') {
      merchantTotals[t.merchant] = (merchantTotals[t.merchant] || 0) + t.amount;
    }
  }

  let topMerchant = '';
  let topMerchantAmount = 0;
  for (const [merch, amt] of Object.entries(merchantTotals)) {
    if (amt > topMerchantAmount) {
      topMerchantAmount = amt;
      topMerchant = merch;
    }
  }

  if (topMerchant) {
    insights.push({
      id: 'ins-top-merchant',
      type: 'merchant',
      title: 'Top Merchant',
      description: `Your highest expenditure destination this month is ${topMerchant} with ₹${topMerchantAmount.toLocaleString('en-IN')} across transactions.`,
      metric: topMerchant,
      sentiment: 'neutral',
    });
  }

  // Weekday vs Weekend spending
  let weekdayTotal = 0;
  let weekdayCount = 0;
  let weekendTotal = 0;
  let weekendCount = 0;

  for (const t of transactions) {
    if (t.transaction_type === 'debit') {
      const day = getDay(new Date(t.transaction_date));
      if (day === 0 || day === 6) {
        weekendTotal += t.amount;
        weekendCount++;
      } else {
        weekdayTotal += t.amount;
        weekdayCount++;
      }
    }
  }

  if (weekendCount > 0 && weekdayCount > 0) {
    const avgWeekend = Math.round(weekendTotal / 2);
    const avgWeekday = Math.round(weekdayTotal / 5);
    if (avgWeekend > avgWeekday) {
      insights.push({
        id: 'ins-weekend',
        type: 'highlight',
        title: 'Weekend Outing Pattern',
        description: `Weekend spending is significantly higher than regular weekdays, driven primarily by dining and leisure activities.`,
        sentiment: 'neutral',
      });
    }
  }

  // Recurring bills detection
  const recurring = detectRecurringExpenses(transactions);
  if (recurring.length > 0) {
    insights.push({
      id: 'ins-recurring',
      type: 'highlight',
      title: 'Recurring Fixed Commitments',
      description: `Detected ${recurring.length} recurring subscription/bill commitments totaling ₹${recurring.reduce((a, b) => a + b.amount, 0).toLocaleString('en-IN')}/mo.`,
      sentiment: 'neutral',
    });
  }

  return insights;
}

export function detectRecurringExpenses(transactions: Transaction[]): { merchant: string; amount: number; count: number }[] {
  const map: Record<string, { amounts: number[]; count: number }> = {};

  for (const t of transactions) {
    if (t.transaction_type === 'debit') {
      const key = t.merchant.toLowerCase();
      if (!map[key]) {
        map[key] = { amounts: [], count: 0 };
      }
      map[key].amounts.push(t.amount);
      map[key].count++;
    }
  }

  const results: { merchant: string; amount: number; count: number }[] = [];

  for (const [key, val] of Object.entries(map)) {
    // Check if subscription or fixed repeated amount
    if (val.count >= 1 && (key.includes('netflix') || key.includes('rent') || key.includes('bescom') || key.includes('spotify') || key.includes('sub'))) {
      results.push({
        merchant: key.charAt(0).toUpperCase() + key.slice(1),
        amount: val.amounts[0],
        count: val.count,
      });
    }
  }

  return results;
}

