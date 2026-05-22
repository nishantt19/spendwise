/**
 * Groups an array of items that have a `date: string` field ("YYYY-MM-DD")
 * into an ordered array of { date, items[] } groups, preserving the original
 * sort order of the input.
 */
export function groupByDate<T extends { date: string }>(
  items: T[],
): { date: string; items: T[] }[] {
  const groups: { date: string; items: T[] }[] = [];
  const dateMap = new Map<string, T[]>();

  for (const item of items) {
    if (!dateMap.has(item.date)) {
      const arr: T[] = [];
      dateMap.set(item.date, arr);
      groups.push({ date: item.date, items: arr });
    }
    dateMap.get(item.date)!.push(item);
  }

  return groups;
}
