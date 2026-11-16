/** České skloňování podle počtu: plural(3, 'tip', 'tipy', 'tipů') -> 'tipy' */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one
  if (n >= 2 && n <= 4) return few
  return many
}
