export function matchText(term: string, query: string): boolean {
  return term.trim().toLowerCase().indexOf(query.trim().toLowerCase()) !== -1;
}
