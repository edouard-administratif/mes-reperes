import { shiftDate } from './dates.js';

const effortPoints = { S: 1, M: 2, L: 4 };

export function chocolateBalance(entries, day) {
  let buckets = [];
  let shortfall = 0;
  const days = [...new Set([...entries.filter(entry => entry.date <= day).map(entry => entry.date), day])].sort();
  for (const date of days) {
    buckets = buckets.filter(bucket => bucket.expires >= date && bucket.count > 0);
    const daily = entries.filter(entry => entry.date === date);
    const points = daily.reduce((sum, entry) => sum +
      (entry.type === 'physical' ? effortPoints[entry.level] : 0), 0);
    if (points >= 2) buckets.push({ earned: date, expires: shiftDate(date, 1), count: Math.floor(points / 2) });
    let used = daily.filter(entry => entry.type === 'chocolate').length;
    for (const bucket of buckets) {
      const amount = Math.min(used, bucket.count);
      bucket.count -= amount;
      used -= amount;
    }
    if (date === day) shortfall = used;
  }
  const carried = buckets.filter(bucket => bucket.earned < day).reduce((sum, bucket) => sum + bucket.count, 0);
  const fresh = buckets.filter(bucket => bucket.earned === day).reduce((sum, bucket) => sum + bucket.count, 0);
  return { total: carried + fresh, carried, fresh, shortfall };
}
