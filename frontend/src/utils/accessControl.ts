export function getRole(): string {
  try {
    const raw = localStorage.getItem('@Intellisys:user');
    if (!raw) return '';
    return JSON.parse(raw)?.role?.toLowerCase() ?? '';
  } catch {
    return '';
  }
}
