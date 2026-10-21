import { useState, useEffect } from 'react';
import { FileText, Calendar as CalendarIcon, User as UserIcon, Loader2, Printer, Filter, CircleDollarSign } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collaboratorService, type Collaborator } from '../services/collaboratorService';
import { dutyService } from '../services/dutyService';
import { Button } from '../components/Button';
import { pdf } from '@react-pdf/renderer';
import { ReportTemplate, registerFonts } from '../components/ReportTemplate';
import { statusLabel, statusClass } from '../utils/dutyStatus';
import { getRole } from '../utils/accessControl';

export interface PlantaoDia {
  dataISO: string;
  data: string;
  diaSemana: string;
  observacao: string;
  valor: number;
}

export interface PlantaoMes {
  chave: string;
  titulo: string;
  dias: PlantaoDia[];
}

export interface PlantaoGroup {
  id: string;
  plantaoId: string;
  colaborador: string;
  periodoInicio: string;
  periodoFim: string;
  status: string;
  rawStatus: string | number;
  valorTotal: number;
  dias: PlantaoDia[];
  meses: PlantaoMes[];
}

const getWeekDay = (date: Date) => {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return days[date.getUTCDay()];
};

const formatSafeDate = (isoDate: string) => {
  if (!isoDate) return '—';
  const d = new Date(isoDate.includes('T') ? isoDate : `${isoDate}T12:00:00Z`);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const agruparDiasPorMes = (dias: PlantaoDia[]): PlantaoMes[] => {
  const meses = new Map<string, PlantaoMes>();

  dias.forEach(dia => {
    const data = new Date(`${dia.dataISO}T12:00:00Z`);
    const chave = dia.dataISO.slice(0, 7);
    const mes = meses.get(chave) ?? {
      chave,
      titulo: new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(data),
      dias: [],
    };
    mes.dias.push(dia);
    meses.set(chave, mes);
  });

  return Array.from(meses.values());
};

export function Reports() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(searchParams.get('start') ?? '');
  const [endDate, setEndDate] = useState(searchParams.get('end') ?? '');
  const [employee, setEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [colaboradores, setColaboradores] = useState<Collaborator[]>([]);
  const [loadingColabs, setLoadingColabs] = useState(true);
  
  const [plantoesList, setPlantoesList] = useState<PlantaoGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [payingPlantaoID, setPayingPlantaoID] = useState<string | null>(null);
  const isFinanceiro = getRole() === 'financeiro';

  useEffect(() => {
    collaboratorService.getAll()
      .then(setColaboradores)
      .catch(() => {})
      .finally(() => setLoadingColabs(false));
  }, []);

  const handleGenerate = async (start: string, end: string, emp: string, statusOpt: string) => {
    if (!start || !end) return;
    setLoading(true);
    setGenerated(false);
    
    try {
      const rawData = await dutyService.getRelatorio({
        data_inicio: start,
        data_fim: end,
        colaborador_id: emp,
        status: statusOpt
      });
      
      const flatList = Array.isArray(rawData) ? rawData : [];

      if (flatList.length === 0) { 
        setPlantoesList([]); 
        setGenerated(true); 
        return; 
      }

      const groupedData = flatList.reduce((acc: any, curr: any) => {
        const pId = curr.plantao_id;
        if (!acc[pId]) {
          acc[pId] = {
            id: pId,
            colaborador_nome: curr.nome_colaborador,
            data_inicio: curr.data_inicio,
            data_fim: curr.data_fim,
            status: curr.status,
            valor_total: curr.valor_total,
            observacaoGeral: curr.observacoes,
            dias: []
          };
        }
        
        acc[pId].dias.push({
          dataBruta: curr.data,
          valor: curr.valor
        });
        
        return acc;
      }, {});

      const result: PlantaoGroup[] = Object.values(groupedData).map((p: any) => {
        const diasOrdenados = p.dias.sort((a: any, b: any) => {
          return new Date(`${a.dataBruta}T12:00:00Z`).getTime() - new Date(`${b.dataBruta}T12:00:00Z`).getTime();
        });

        const diasDetalhados: PlantaoDia[] = diasOrdenados.map((d: any, index: number) => {
          const dataDia = new Date(`${d.dataBruta}T12:00:00Z`);
          return {
            dataISO: d.dataBruta,
            data: formatSafeDate(d.dataBruta),
            diaSemana: getWeekDay(dataDia),
            observacao: index === 0 ? (p.observacaoGeral || '') : '',
            valor: Number(d.valor || 0),
          };
        });

        return {
          id: String(p.id || '—').split('-')[0].toUpperCase(),
          plantaoId: String(p.id),
          colaborador: p.colaborador_nome || '—',
          periodoInicio: formatSafeDate(p.data_inicio),
          periodoFim: formatSafeDate(p.data_fim),
          status: statusLabel(p.status),
          rawStatus: p.status, 
          valorTotal: Number(p.valor_total || 0),
          dias: diasDetalhados,
          meses: agruparDiasPorMes(diasDetalhados),
        };
      });

      result.sort((a, b) => {
        if (a.colaborador !== b.colaborador) return a.colaborador.localeCompare(b.colaborador);
        return new Date(a.periodoInicio.split('/').reverse().join('-')).getTime() - new Date(b.periodoInicio.split('/').reverse().join('-')).getTime();
      });

      setPlantoesList(result);
      setGenerated(true);
    } catch (error) {
      console.error("Erro interno ao montar a lista de relatórios:", error);
      setPlantoesList([]);
      setGenerated(true);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleGenerate(startDate, endDate, employee, statusFilter);
  };

  const handlePagar = async (plantao: PlantaoGroup) => {
    if (!confirm(`Confirmar o pagamento do plantão de ${plantao.colaborador}?`)) return;
    setPayingPlantaoID(plantao.plantaoId);
    try {
      await dutyService.pagar(plantao.plantaoId);
      setPlantoesList(current => current.map(item => item.plantaoId === plantao.plantaoId
        ? { ...item, rawStatus: 4, status: statusLabel(4) }
        : item));
      alert('Plantão pago com sucesso!');
    } catch {
      alert('Erro ao realizar o pagamento do plantão.');
    } finally {
      setPayingPlantaoID(null);
    }
  };

  const handlePrint = async () => {
    const win = window.open('about:blank', '_blank');

    try {
      let logoBase64 = '';
      try {
        const logoModule = await import('../assets/images/logo.png');
        const res = await fetch(logoModule.default);
        const blob = await res.blob();
        logoBase64 = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { /* Sem logo */ }

      registerFonts();

      const emitidoEm = `${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const ptIn = startDate ? new Date(`${startDate}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
      const ptFim = endDate ? new Date(`${endDate}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
      
      const funcNome = employee ? (colaboradores.find(c => c.id === employee)?.nome || 'Todos') : 'Todos';
      // Aqui usamos a função utilitária para garantir que o nome impresso seja exato ao selecionado
      const statusNome = statusFilter ? statusLabel(statusFilter) : 'Todos';
      
      const filtrosText = `Periodo --> ${ptIn} a ${ptFim}    Status --> ${statusNome}    Funcionário --> ${funcNome}`;

      const element = ReportTemplate({ 
        plantoes: plantoesList, 
        filtrosText, 
        emitidoEm, 
        logoBase64,
        quebrarPorMes: true,
      });
      
      const blob = await pdf(element).toBlob();
      const url = URL.createObjectURL(blob);

      if (win) {
        win.location.href = url;
      } else {
        window.open(url, '_blank');
      }
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      win?.close();
    }
  };

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col pt-6">
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-6xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Relatório Gerencial</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Selecione os filtros para gerar o relatório detalhado.</p>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
        <form onSubmit={onSubmit} className="border border-gray-100 rounded-xl p-5 shadow-sm bg-white flex flex-col gap-5">
          <h3 className="text-[#B5071A] font-bold flex items-center gap-2 text-xs uppercase tracking-wider">
            <CalendarIcon size={16} /> Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Início</label>
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)}
                className="h-11 w-full px-4 rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-[#B5071A] outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Fim</label>
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)}
                className="h-11 w-full px-4 rounded-xl border border-gray-200 text-sm text-gray-700 focus:border-[#B5071A] outline-none transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 flex items-center gap-1">
                <Filter size={11} /> Status
              </label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="h-11 w-full px-4 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:border-[#B5071A] outline-none transition-all">
                <option value="">Todos</option>
                {/* CORREÇÃO APLICADA AQUI: Valores numéricos batendo com a lógica de domínio */}
                <option value="0">Agendado</option>
                <option value="1">Em Andamento</option>
                <option value="2">Concluído / Fechado</option>
                <option value="3">Cancelado</option>
                <option value="4">Pago / Validado</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 flex items-center gap-1">
                <UserIcon size={11} /> Funcionário
              </label>
              <select value={employee} onChange={e => setEmployee(e.target.value)}
                className="h-11 w-full px-4 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:border-[#B5071A] outline-none transition-all">
                <option value="">Todos</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                {loadingColabs && <option disabled>Carregando...</option>}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Button type="submit" label={loading ? 'Gerando...' : 'Gerar'} icon={loading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} disabled={loading} />
            {generated && plantoesList.length > 0 && <Button type="button" label="Baixar PDF" icon={<Printer size={14} />} variant="secondary" onClick={handlePrint} />}
            <Button type="button" label="Voltar" variant="secondary" onClick={() => navigate(-1)} />
          </div>
        </form>

        {/* PRÉ-VISUALIZAÇÃO EM TELA */}
        {generated && (
          <div className="flex flex-col gap-6">
            {plantoesList.length === 0 ? (
              <div className="border border-gray-100 rounded-xl p-10 bg-white shadow-sm text-center text-gray-400 text-sm">
                Nenhum plantão encontrado para o período e filtros selecionados.
              </div>
            ) : (
              plantoesList.map((p, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white p-5 flex flex-col gap-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cód. Plantão</p>
                      <p className="text-sm font-bold text-gray-700 mt-0.5" title={p.id}>{p.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Funcionário</p>
                      <p className="text-sm font-bold text-gray-700 mt-0.5 truncate">{p.colaborador}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Período</p>
                      <p className="text-sm font-bold text-gray-700 mt-0.5">{p.periodoInicio} a {p.periodoFim}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Status</p>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full w-fit ${statusClass(p.rawStatus)}`}>{p.status}</span>
                    </div>
                  </div>
                  
                  <div className="border border-gray-100 rounded-lg overflow-hidden">
                    {p.meses.map(mes => (
                      <div key={mes.chave} className="border-b border-gray-100 last:border-0">
                        <div className="bg-gray-50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                          {mes.titulo}
                        </div>
                        <div className="grid grid-cols-[1fr_1.2fr_2fr_1fr] bg-gray-50 border-y border-gray-100 px-4 py-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dia da Semana</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Observação</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Valor</span>
                        </div>
                        {mes.dias.map(d => (
                          <div key={d.dataISO} className="grid grid-cols-[1fr_1.2fr_2fr_1fr] px-4 py-2.5 border-b border-gray-50 last:border-0 items-center">
                            <span className="text-xs text-gray-600 font-medium">{d.data}</span>
                            <span className="text-xs text-gray-600">{d.diaSemana}</span>
                            <span className="text-xs text-gray-500 truncate" title={d.observacao}>{d.observacao || '—'}</span>
                            <span className="text-xs font-bold text-gray-700 text-right">
                              {d.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                    
                    <div className="bg-gray-50 flex justify-between px-4 py-3 border-t border-gray-100 items-center">
                      <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Total do Plantão</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#B5071A]">
                          {p.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        {isFinanceiro && String(p.rawStatus) === '2' && (
                          <Button
                            type="button"
                            label={payingPlantaoID === p.plantaoId ? 'Pagando...' : 'Pagar'}
                            icon={payingPlantaoID === p.plantaoId ? <Loader2 size={14} className="animate-spin" /> : <CircleDollarSign size={14} />}
                            disabled={payingPlantaoID !== null}
                            onClick={() => handlePagar(p)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
