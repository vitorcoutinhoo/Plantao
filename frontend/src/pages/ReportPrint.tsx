// ─── CÓDIGO LEGADO, IGNORAR POR ENQUANTO ─────────────────────────────────────────────────────────────


import { useEffect } from 'react';
import logo from '../assets/images/logo.png';
import { statusLabel, statusColors } from '../utils/dutyStatus';

interface ReportRow {
  colaborador: string;
  inicio: string;
  fim: string;
  status: string;
  valor: number | null;
}

interface PrintData {
  rows: ReportRow[];
  periodoInicio: string;
  periodoFim: string;
  funcionarioNome: string;
  emitidoEm: string;
  totalValor: number;
}


const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

const block: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '14px 20px',
};

export function ReportPrint() {
  const raw = sessionStorage.getItem('report-print-data');
  const data: PrintData | null = raw ? JSON.parse(raw) : null;

  useEffect(() => {
    if (data) {
      document.title = `Relatório de Escala — ${data.periodoInicio} a ${data.periodoFim}`;
      setTimeout(() => window.print(), 500);
    }
  }, []);

  if (!data) {
    return (
      <div style={{ fontFamily: 'Inter, Arial, sans-serif', padding: '48px', textAlign: 'center', color: '#6b7280' }}>
        Nenhum dado para imprimir.
      </div>
    );
  }

  const { rows, periodoInicio, periodoFim, funcionarioNome, emitidoEm, totalValor } = data;

  return (
    <div style={{ fontFamily: 'Inter, Arial, sans-serif', padding: '40px 48px', color: '#111827', background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* LOGO */}
      <div style={{ ...block, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src={logo} alt="Intellisys" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
        <div style={{ width: '1px', height: '28px', background: '#e5e7eb' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '0.01em' }}>
          Relatório de Escala de Plantões
        </span>
      </div>

      {/* INFO */}
      <div style={{ ...block, borderColor: '#B5071A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '3px' }}>Período</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{periodoInicio} → {periodoFim}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '3px' }}>Funcionário</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{funcionarioNome}</div>
          </div>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '3px' }}>Plantões</div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827' }}>{rows.length}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: '3px' }}>Valor Total</div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#B5071A' }}>R$ {totalValor.toFixed(2)}</div>
        </div>
      </div>

      {/* TABELA */}
      <div style={{ ...block, padding: 0, overflow: 'hidden', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '35%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <thead>
            <tr style={{ background: '#B5071A' }}>
              {['Funcionário', 'Início', 'Fim', 'Status', 'Valor'].map((h, i) => (
                <th key={h} style={{
                  padding: '10px 16px',
                  textAlign: i === 4 ? 'right' : 'left',
                  fontSize: '9px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: '#fff',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ padding: '9px 16px', fontWeight: 600, color: '#111827', borderBottom: '1px solid #f3f4f6' }}>{r.colaborador}</td>
                <td style={{ padding: '9px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{formatDate(r.inicio)}</td>
                <td style={{ padding: '9px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' }}>{formatDate(r.fim)}</td>
                <td style={{ padding: '9px 16px', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                    fontSize: '9px', fontWeight: 700, textTransform: 'uppercase',
                    ...statusColors(r.status),
                  }}>
                    {statusLabel(r.status)}
                  </span>
                </td>
                <td style={{ padding: '9px 16px', textAlign: 'right', fontWeight: 600, color: '#111827', borderBottom: '1px solid #f3f4f6' }}>
                  {r.valor != null ? `R$ ${r.valor.toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#1f2937' }}>
              <td colSpan={3} style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {rows.length} plantão(ões) no período
              </td>
              <td style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>Total Geral</td>
              <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, color: '#ffffff', fontSize: '13px' }}>
                R$ {totalValor.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* RODAPÉ */}
      <div style={{ ...block, borderColor: '#B5071A', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: '10px', color: '#6b7280' }}>
          Intellisys Informática Ltda — Todos os direitos reservados © {new Date().getFullYear()}
        </span>
      </div>

      {/* OUTRAS INFO */}
      <div style={{ ...block, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: '#9ca3af' }}>
          Documento gerado automaticamente pelo sistema de gestão de plantões &nbsp;·&nbsp; Emitido em: {emitidoEm}
        </span>
      </div>

      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; }
        }
      `}</style>
    </div>
  );
}
