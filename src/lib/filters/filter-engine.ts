import { Transaction, FilterGroup, FilterRule, FilterOperator } from '@/types';
import { isWithinInterval, subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears, parseISO } from 'date-fns';

export function evaluateRule(txn: Transaction, rule: FilterRule): boolean {
  let val: any;

  switch (rule.field) {
    case 'category':
      val = txn.category_id || txn.category?.slug || '';
      break;
    case 'amount':
      val = txn.amount;
      break;
    case 'merchant':
      val = txn.merchant.toLowerCase();
      break;
    case 'bank_sender':
      val = txn.bank_sender.toLowerCase();
      break;
    case 'transaction_type':
      val = txn.transaction_type;
      break;
    case 'status':
      val = txn.status;
      break;
    case 'date':
      val = new Date(txn.transaction_date).getTime();
      break;
    default:
      return true;
  }

  const target = typeof rule.value === 'string' ? rule.value.toLowerCase() : rule.value;

  switch (rule.operator) {
    case 'equals':
      return String(val).toLowerCase() === String(target).toLowerCase();

    case 'not_equals':
      return String(val).toLowerCase() !== String(target).toLowerCase();

    case 'greater_than':
      return Number(val) > Number(target);

    case 'less_than':
      return Number(val) < Number(target);

    case 'contains':
      return String(val).toLowerCase().includes(String(target).toLowerCase());

    case 'in':
      if (Array.isArray(rule.value)) {
        return rule.value.some((v) => String(v).toLowerCase() === String(val).toLowerCase());
      }
      return false;

    case 'between':
      if (rule.value !== undefined && rule.valueTo !== undefined) {
        return Number(val) >= Number(rule.value) && Number(val) <= Number(rule.valueTo);
      }
      return true;

    default:
      return true;
  }
}

export function evaluateFilterGroup(txn: Transaction, group: FilterGroup): boolean {
  if (!group.rules || group.rules.length === 0) return true;

  if (group.logic === 'AND') {
    return group.rules.every((child) => {
      if ('logic' in child) {
        return evaluateFilterGroup(txn, child as FilterGroup);
      }
      return evaluateRule(txn, child as FilterRule);
    });
  } else {
    // OR Logic
    return group.rules.some((child) => {
      if ('logic' in child) {
        return evaluateFilterGroup(txn, child as FilterGroup);
      }
      return evaluateRule(txn, child as FilterRule);
    });
  }
}

export type QuickDatePreset =
  | 'all'
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'this_week'
  | 'prev_week'
  | 'this_month'
  | 'prev_month'
  | 'this_year'
  | 'prev_year'
  | 'custom';

export function filterByDatePreset(transactions: Transaction[], preset: QuickDatePreset, customRange?: { from: Date; to: Date }): Transaction[] {
  if (preset === 'all') return transactions;

  const now = new Date();

  return transactions.filter((txn) => {
    const d = new Date(txn.transaction_date);

    switch (preset) {
      case 'today':
        return d.toDateString() === now.toDateString();

      case 'yesterday':
        const yest = subDays(now, 1);
        return d.toDateString() === yest.toDateString();

      case 'last_7_days':
        return d >= subDays(now, 7);

      case 'last_30_days':
        return d >= subDays(now, 30);

      case 'this_week':
        return isWithinInterval(d, { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) });

      case 'prev_week':
        const lastWeek = subWeeks(now, 1);
        return isWithinInterval(d, { start: startOfWeek(lastWeek, { weekStartsOn: 1 }), end: endOfWeek(lastWeek, { weekStartsOn: 1 }) });

      case 'this_month':
        return isWithinInterval(d, { start: startOfMonth(now), end: endOfMonth(now) });

      case 'prev_month':
        const prevM = subMonths(now, 1);
        return isWithinInterval(d, { start: startOfMonth(prevM), end: endOfMonth(prevM) });

      case 'this_year':
        return isWithinInterval(d, { start: startOfYear(now), end: endOfYear(now) });

      case 'prev_year':
        const prevY = subYears(now, 1);
        return isWithinInterval(d, { start: startOfYear(prevY), end: endOfYear(prevY) });

      case 'custom':
        if (customRange?.from && customRange?.to) {
          return isWithinInterval(d, { start: customRange.from, end: customRange.to });
        }
        return true;

      default:
        return true;
    }
  });
}

