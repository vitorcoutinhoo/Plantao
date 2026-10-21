import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Printer } from 'lucide-react';
import { collaboratorService, type Collaborator } from '../../services/collaboratorService';
import { dutyService, type Duty } from '../../services/dutyService';
import { Button } from '../../components/Button';
import { DataTable } from '../../components/DataTable';
import { pdf } from '@react-pdf/renderer';
import { ReportTemplate, registerFonts, type PlantaoGroup } from '../../components/ReportTemplate';
import { statusLabel, statusClass as statusStyle } from '../../utils/dutyStatus';


const formatDate = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
};

type DutyPeriod = Duty['periodo'] & Partial<{
  inicio: string;
  fim: string;
}>;

const getPeriodStart = (periodo: Duty['periodo']) => {
  const p = periodo as DutyPeriod;
  return p.Inicio ?? p.inicio ?? '';
};

const getPeriodEnd = (periodo: Duty['periodo']) => {
  const p = periodo as DutyPeriod;
  return p.Fim ?? p.fim ?? '';
};

export function DutyHistory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [colaborador, setColaborador] = useState<Collaborator | null>(null);
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      collaboratorService.getById(id),
      dutyService.getByColaborador(id),
    ])
      .then(([colab, ds]) => {
        setColaborador(colab);
        const sortedDuties = Array.isArray(ds) ? [...ds].sort((a, b) => {
          const ai = getPeriodStart(a.periodo);
          const bi = getPeriodStart(b.periodo);
          return new Date(bi).getTime() - new Date(ai).getTime();
        }) : [];
        setDuties(sortedDuties);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  const totalValor = duties.reduce((acc, d) => acc + (d.valor_total ?? 0), 0);

  const handlePrint = async () => {
    if (!colaborador) return;
    const win = window.open('about:blank', '_blank');
    setPrinting(true);
    try {
      let logoBase64 = '';
      try {
        const logoModule = await import('../../assets/images/logo.png');
        const res = await fetch(logoModule.default);
        const blob = await res.blob();
        logoBase64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { /* sem logo */ }

      const plantoes: PlantaoGroup[] = duties.map(d => {
        return {
          id: String(d.id || '—').split('-')[0].toUpperCase(),
          colaborador: colaborador.nome,
          periodoInicio: formatDate(getPeriodStart(d.periodo)),
          periodoFim: formatDate(getPeriodEnd(d.periodo)),
          status: statusLabel(d.status),
          valorTotal: Number(d.valor_total || 0),
          dias: [],
        };
      });

      const emitidoEm = `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const filtrosText = `Funcionário --> ${colaborador.nome}`;

      registerFonts();
      const element = ReportTemplate({
        plantoes,
        filtrosText,
        emitidoEm,
        logoBase64,
      });
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);

      if (win) win.location.href = url;
      else window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      win?.close();
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 size={40} className="text-[#B5071A] animate-spin" />
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Carregando histórico...</p>
      </div>
    );
  }

  if (error || !colaborador) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center">
        <AlertCircle size={48} className="text-gray-300" />
        <h2 className="text-gray-600 font-bold">Erro ao carregar histórico</h2>
        <button onClick={() => navigate(-1)} className="bg-[#B5071A] text-white px-8 py-2 rounded-xl text-sm font-bold">Voltar</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col pt-6">

      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-5xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Histórico de Plantões</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium uppercase tracking-wider">{colaborador.nome}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col">

        <DataTable<Duty>
          columns={[
            { header: 'Início' },
            { header: 'Fim' },
            { header: 'Status' },
            { header: 'Valor', className: 'text-right' },
          ]}
          gridCols="grid-cols-[1fr_1fr_1fr_1fr]"
          items={duties}
          rowKey={d => d.id}
          emptyMessage="Nenhum plantão registrado."
          containerClassName="mb-4"
          mobileClassName="pb-4"
          renderRow={d => {
            const inicio = getPeriodStart(d.periodo);
            const fim = getPeriodEnd(d.periodo);
            const st = String(d.status);
            return (
              <>
                <span className="text-xs text-gray-600">{formatDate(inicio)}</span>
                <span className="text-xs text-gray-600">{formatDate(fim)}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full w-fit ${statusStyle(st)}`}>
                  {statusLabel(st)}
                </span>
                <span className="text-xs font-bold text-gray-700 text-right">
                  {d.valor_total != null ? `R$ ${d.valor_total.toFixed(2)}` : '—'}
                </span>
              </>
            );
          }}
          renderMobileCard={d => {
            const inicio = getPeriodStart(d.periodo);
            const fim = getPeriodEnd(d.periodo);
            const st = String(d.status);
            return (
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-500">{formatDate(inicio)} → {formatDate(fim)}</span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusStyle(st)}`}>
                    {statusLabel(st)}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-700 text-right">
                  {d.valor_total != null ? `R$ ${d.valor_total.toFixed(2)}` : '—'}
                </p>
              </>
            );
          }}
        />

        {duties.length > 0 && (
          <div className="flex justify-between items-center border border-gray-100 rounded-xl px-6 py-4 bg-gray-50 shadow-sm mb-6">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{duties.length} plantão(ões)</span>
            <span className="text-sm font-bold text-gray-800">Total: R$ {totalValor.toFixed(2)}</span>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:border-none md:p-0 md:flex md:justify-end md:gap-3">
          {duties.length > 0 && (
            <Button
              label={printing ? 'Gerando...' : 'Imprimir Relatório'}
              icon={printing ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
              disabled={printing}
              onClick={handlePrint}
            />
          )}
          <Button label="Voltar" variant="secondary" onClick={() => navigate(`/users/details/${id}`)} />
        </div>
      </div>
    </div>
  );
}
