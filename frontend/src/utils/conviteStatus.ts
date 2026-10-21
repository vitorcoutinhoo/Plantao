const DATE_ONLY_ISO = /^\d{4}-\d{2}-\d{2}$/;
const DATE_ONLY_BR = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function parseExpiraEm(expiraEm: string): Date {
  const br = DATE_ONLY_BR.exec(expiraEm);
  if (br) {
    const [, d, m, y] = br;
    return new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 59, 999);
  }
  if (DATE_ONLY_ISO.test(expiraEm)) {
    const [y, m, d] = expiraEm.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }
  return new Date(expiraEm);
}

export function isExpirado(expiraEm: string): boolean {
  return parseExpiraEm(expiraEm) < new Date();
}

// O backend não deleta convites: "revogar" faz UPDATE usado=TRUE e zera
// expira_em para '2000-01-01 00:00:00' UTC (ver convite_repository.go
// Disable()). Como o backend formata essa data no fuso local do servidor
// antes de mandar pro front, ela pode chegar como 01/01/2000 OU 31/12/1999
// (um dia antes, se o fuso do servidor estiver atrás de UTC). Um convite
// "usado" de verdade nunca cai nessas datas, então elas distinguem
// revogado de efetivamente usado.
const SENTINELS_REVOGADO_ISO = ['2000-01-01', '1999-12-31'];

export function isRevogado(expiraEm: string, usado: boolean): boolean {
  if (!usado) return false;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(expiraEm);
  const iso = br ? `${br[3]}-${br[2]}-${br[1]}` : expiraEm.slice(0, 10);
  return SENTINELS_REVOGADO_ISO.includes(iso);
}
