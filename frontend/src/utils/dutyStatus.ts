const NUM_TO_KEY: Record<string, string> = {
  '0': 'AGENDADO', // Representa o "0 plantão gerado"
  '1': 'EM_ANDAMENTO',
  '2': 'CONCLUIDO',
  '3': 'CANCELADO',
  '4': 'PAGO',
};

const KEY_TO_NUM: Record<string, string> = {
  AGENDADO: '0',
  EM_ANDAMENTO: '1',
  CONCLUIDO: '2',
  CANCELADO: '3',
  PAGO: '4',
};

export function statusToApiValue(status: string): string {
  const key = normalizeStatus(status);
  return KEY_TO_NUM[key] ?? key;
}

const LABELS: Record<string, string> = {
  AGENDADO: 'Agendado',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  PAGO: 'Pago',
};

export function normalizeStatus(status: string | number): string {
  const s = String(status);
  // Se for número ('0', '1', etc), converte para a chave ('AGENDADO', 'EM_ANDAMENTO')
  return NUM_TO_KEY[s] ?? s.toUpperCase();
}

export function statusLabel(status: string | number): string {
  const key = normalizeStatus(status);
  return LABELS[key] ?? String(status);
}

export function statusClass(status: string | number): string {
  const key = normalizeStatus(status);
  if (key === 'PAGO') return 'text-green-600 bg-green-50';
  if (key === 'CANCELADO') return 'text-red-600 bg-red-50';
  if (key === 'CONCLUIDO') return 'text-purple-600 bg-purple-50';
  if (key === 'EM_ANDAMENTO') return 'text-blue-600 bg-blue-50';
  return 'text-orange-600 bg-orange-50'; // AGENDADO / GERADO
}

export function statusColors(status: string | number): { background: string; color: string } {
  const key = normalizeStatus(status);
  if (key === 'PAGO') return { background: '#f0fdf4', color: '#15803d' };
  if (key === 'CANCELADO') return { background: '#fef2f2', color: '#b91c1c' };
  if (key === 'CONCLUIDO') return { background: '#faf5ff', color: '#7e22ce' };
  if (key === 'EM_ANDAMENTO') return { background: '#eff6ff', color: '#1d4ed8' };
  return { background: '#fff7ed', color: '#c2410c' }; // AGENDADO / GERADO
}

export function isStatusAtivo(status: string | number): boolean {
  const key = normalizeStatus(status);
  return key === 'AGENDADO' || key === 'EM_ANDAMENTO';
}