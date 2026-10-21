import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Check, RefreshCw, ChevronLeft, ChevronRight, Loader2, Lock } from 'lucide-react';
import { collaboratorService, type Collaborator } from '../../services/collaboratorService';
import { scaleService } from '../../services/scaleService';
import { dutyService } from '../../services/dutyService';
import { Button } from '../../components/Button';

const MIN_BLOCO_DIAS = 7;

interface Bloco {
  inicio: Date;
  fim: Date;
  collaborator: Collaborator;
}

interface DayEntry {
  date: Date;
  weekDayIdx: number;
  blocoIdx: number;
  collaborator: Collaborator;
  isHoliday: boolean;
  holidayName?: string;
}

const daysOfWeek = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const pad = (n: number) => String(n).padStart(2, '0');
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diffDays = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
const formatShort = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

const safeDate = (iso: string) => {
  if (!iso) return new Date();
  return new Date(iso.includes('T') ? iso : `${iso}T12:00:00Z`);
};

export function Suggestion() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // INICIALIZAÇÃO INTELIGENTE DA DATA
  const [currentDate, setCurrentDate] = useState(() => {
    // 1. Tenta ler via Query Params (ex: /sugestao?year=2026&month=10)
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month'); // Assumindo base 1-12 na URL
    if (yearParam && monthParam) {
      return new Date(parseInt(yearParam, 10), parseInt(monthParam, 10) - 1, 1);
    }

    // 2. Tenta ler via React Router State (ex: navigate('/sugestao', { state: { date: '2026-10-01' } }))
    if (location.state?.date) {
      const stateDate = new Date(location.state.date);
      if (!isNaN(stateDate.getTime())) return stateDate;
    }

    // 3. Fallback seguro: Mês atual do mundo real
    return new Date();
  });

  const [staff, setStaff] = useState<Collaborator[]>([]);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [staffOffset, setStaffOffset] = useState(0);
  const [selectedBlocos, setSelectedBlocos] = useState<Set<number>>(new Set());
  const [herdado, setHerdado] = useState<{ fim: Date; nomeColaborador: string } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(currentDate);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const monthStart = useMemo(() => new Date(year, month, 1), [year, month]);
  const monthEnd = useMemo(() => new Date(year, month + 1, 0), [year, month]);

  useEffect(() => {
    setStaffOffset(0);
    setSelectedBlocos(new Set());
    
    async function load() {
      setLoading(true);
      try {
        const prevMonthStart = new Date(year, month - 1, 1);
        const [colaboradores, feriados, plantoesOverlap] = await Promise.all([
          collaboratorService.getAll(),
          scaleService.getFeriados(year),
          dutyService.getByPeriod(
            `${prevMonthStart.getFullYear()}-${pad(prevMonthStart.getMonth() + 1)}-01`,
            `${year}-${pad(month + 1)}-${pad(monthEnd.getDate())}`,
          ),
        ]);
        
        setStaff(colaboradores.filter(c => c.ativo_plantao === 'ativo' && c.status === 'ativo'));

        const map: Record<string, string> = {};
        if (Array.isArray(feriados)) {
          feriados.forEach(f => { map[f.data.split('T')[0]] = f.nome; });
        }
        setHolidays(map);

        const colabMap: Record<string, string> = {};
        colaboradores.forEach(c => { colabMap[c.id] = c.nome; });
        
        let carriedOver: { fim: Date; nomeColaborador: string } | null = null;
        if (Array.isArray(plantoesOverlap)) {
          for (const p of plantoesOverlap) {
            const inicio = safeDate(p.periodo?.Inicio || (p as any).data_inicio);
            const fim = safeDate(p.periodo?.Fim || (p as any).data_fim);
            
            if (inicio < monthStart && fim >= monthStart) {
              if (!carriedOver || fim > carriedOver.fim) {
                carriedOver = { fim, nomeColaborador: colabMap[p.colaborador_id] ?? '—' };
              }
            }
          }
        }
        setHerdado(carriedOver);
      } catch {
        // mantém vazio
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [year, month, monthStart, monthEnd]);

  const blocos = useMemo<Bloco[]>(() => {
    if (staff.length === 0) return [];
    const result: Bloco[] = [];
    let inicio = herdado ? addDays(herdado.fim, 1) : new Date(monthStart);
    if (inicio > monthEnd) return result;
    
    let idx = 0;
    while (inicio <= monthEnd) {
      let fim = addDays(inicio, MIN_BLOCO_DIAS - 1);
      if (fim < monthEnd && diffDays(inicio, monthEnd) < MIN_BLOCO_DIAS) {
        fim = addDays(inicio, MIN_BLOCO_DIAS - 1);
      }
      result.push({
        inicio: new Date(inicio),
        fim: new Date(fim),
        collaborator: staff[(idx + staffOffset) % staff.length],
      });
      inicio = addDays(fim, 1);
      idx++;
    }
    return result;
  }, [staff, monthStart, monthEnd, staffOffset, herdado]);

  useEffect(() => {
    setSelectedBlocos(new Set(blocos.map((_, i) => i)));
  }, [blocos]);

  const suggestions = useMemo<DayEntry[]>(() => {
    const days: DayEntry[] = [];
    for (let bi = 0; bi < blocos.length; bi++) {
      const bloco = blocos[bi];
      let d = new Date(bloco.inicio);
      while (d <= bloco.fim) {
        let dayIdx = d.getDay();
        dayIdx = dayIdx === 0 ? 6 : dayIdx - 1;
        const dateKey = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        days.push({
          date: new Date(d),
          weekDayIdx: dayIdx,
          blocoIdx: bi,
          collaborator: bloco.collaborator,
          isHoliday: !!holidays[dateKey],
          holidayName: holidays[dateKey],
        });
        d = addDays(d, 1);
      }
    }
    return days;
  }, [blocos, holidays]);

  const herdadoDays = useMemo<Date[]>(() => {
    if (!herdado) return [];
    const days: Date[] = [];
    let d = new Date(monthStart);
    while (d <= herdado.fim && d <= monthEnd) {
      days.push(new Date(d));
      d = addDays(d, 1);
    }
    return days;
  }, [herdado, monthStart, monthEnd]);

  const firstDayIdx = useMemo(() => {
    const d = monthStart.getDay();
    return d === 0 ? 6 : d - 1;
  }, [monthStart]);

  const toggleBloco = (i: number) => {
    setSelectedBlocos(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleConfirmar = async () => {
    const toCreate = blocos.filter((_, i) => selectedBlocos.has(i));
    if (toCreate.length === 0) {
      alert('Selecione ao menos um bloco para confirmar.');
      return;
    }
    setConfirming(true);
    
    try {
      for (const b of toCreate) {
        await dutyService.create({
          colaborador_id: b.collaborator.id,
          periodo: {
            inicio: `${b.inicio.getFullYear()}-${pad(b.inicio.getMonth() + 1)}-${pad(b.inicio.getDate())}T12:00:00Z`,
            fim: `${b.fim.getFullYear()}-${pad(b.fim.getMonth() + 1)}-${pad(b.fim.getDate())}T12:00:00Z`,
          },
        });
      }
      
      alert('Escala confirmada com sucesso!');
      navigate('/scale/month');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Erro ao confirmar escala. Alguns plantões podem não ter sido salvos.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-white min-h-full font-inter flex flex-col">

      <div className="flex items-center justify-center mb-4 max-w-5xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Sugestão de Escala</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Selecione os blocos que deseja confirmar.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex gap-4 items-center font-bold text-gray-800">
            <ChevronLeft size={24} className="cursor-pointer hover:text-[#B5071A]" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} />
            <span className="text-lg md:text-xl">{capitalizedMonth} {year}</span>
            <ChevronRight size={24} className="cursor-pointer hover:text-[#B5071A]" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-grow py-20">
            <Loader2 size={32} className="text-[#B5071A] animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex items-center justify-center flex-grow py-20">
            <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Nenhum colaborador disponível para plantão.</p>
          </div>
        ) : (
          <>
            {herdado && (
              <div className="mb-4 flex items-center gap-2 border border-gray-100 rounded-xl px-4 py-3 bg-gray-50">
                <Lock size={14} className="text-gray-400 shrink-0" />
                <span className="text-xs text-gray-500">
                  <span className="font-bold text-gray-700">{formatShort(monthStart)} → {formatShort(herdado.fim)}</span> já está confirmado para <span className="font-bold text-[#B5071A]">{herdado.nomeColaborador}</span> (bloco do mês anterior).
                </span>
              </div>
            )}

            {/* RESUMO DOS BLOCOS */}
            <div className="mb-4 border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr] bg-gray-50 border-b border-gray-100 px-4 py-3 gap-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-5"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Período</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dias</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colaborador</span>
              </div>
              {blocos.map((b, i) => {
                const isSelected = selectedBlocos.has(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleBloco(i)}
                    className={[
                      'grid grid-cols-[auto_1fr_1fr_1fr] px-4 py-3 border-b border-gray-50 items-center gap-3 cursor-pointer transition-colors',
                      isSelected ? 'bg-red-50' : 'hover:bg-gray-50 opacity-50',
                    ].join(' ')}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#B5071A] border-[#B5071A]' : 'border-gray-300'}`}>
                      {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-xs font-bold text-gray-700">{formatShort(b.inicio)} → {formatShort(b.fim)}</span>
                    <span className="text-xs text-gray-500">{diffDays(b.inicio, b.fim)} dias</span>
                    <span className="text-xs font-bold text-[#B5071A]">{b.collaborator.nome}</span>
                  </div>
                );
              })}
            </div>

            {/* CALENDÁRIO DESKTOP */}
            <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="grid grid-cols-7 bg-gray-100 gap-[1px]">
                {daysOfWeek.map(d => (
                  <div key={d} className="py-2.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-gray-100 gap-[1px]">
                {Array.from({ length: firstDayIdx }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-20 bg-white opacity-50" />
                ))}
                {herdadoDays.map(d => (
                  <div key={`herdado-${d.getTime()}`} className="h-20 p-2 flex flex-col justify-between bg-gray-100">
                    <span className="text-lg font-bold leading-none text-gray-300">{d.getDate()}</span>
                    <span className="text-[9px] font-semibold truncate text-gray-400 flex items-center gap-1"><Lock size={9} /> {herdado?.nomeColaborador.split(' ')[0]}</span>
                  </div>
                ))}
                {suggestions.filter(item => item.date <= monthEnd).map(item => {
                  const isSelected = selectedBlocos.has(item.blocoIdx);
                  return (
                    <div
                      key={item.date.getTime()}
                      onClick={() => toggleBloco(item.blocoIdx)}
                      className={[
                        'h-20 p-2 flex flex-col justify-between transition-colors cursor-pointer',
                        item.isHoliday ? 'bg-[#B5071A]/5' : isSelected ? 'bg-white hover:bg-gray-50' : 'bg-white opacity-40 hover:opacity-60',
                      ].join(' ')}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-lg font-bold leading-none ${item.isHoliday ? 'text-[#B5071A]' : 'text-[#B8BEC7]'}`}>{item.date.getDate()}</span>
                        {item.isHoliday && <span className="text-[8px] font-bold text-[#B5071A] uppercase leading-tight line-clamp-1">{item.holidayName}</span>}
                      </div>
                      <span className={`text-[9px] font-semibold truncate ${isSelected ? 'text-gray-500' : 'text-gray-300'}`}>{item.collaborator.nome.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MOBILE */}
            <div className="md:hidden space-y-3 pb-32">
              {blocos.map((b, i) => {
                const isSelected = selectedBlocos.has(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleBloco(i)}
                    className={[
                      'border rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all',
                      isSelected ? 'bg-red-50 border-[#B5071A]' : 'bg-gray-50 border-gray-100 opacity-50',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-[#B5071A] border-[#B5071A]' : 'border-gray-300'}`}>
                        {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Bloco {i + 1}</p>
                        <p className="text-xs font-bold text-gray-700">{formatShort(b.inicio)} → {formatShort(b.fim)}</p>
                        <p className="text-[10px] text-gray-500">{diffDays(b.inicio, b.fim)} dias</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#B5071A] bg-red-50 px-3 py-1.5 rounded-lg">{b.collaborator.nome.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:relative md:border-none md:p-0 md:mt-4 md:flex md:justify-end md:gap-3">
          <div className="grid grid-cols-3 gap-2 md:flex md:gap-3">
            <Button
              variant="secondary"
              icon={<RefreshCw size={14} />}
              label="Regerar"
              onClick={() => setStaffOffset(o => o + 1)}
            />
            <Button
              icon={confirming ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              label={confirming ? 'Confirmando...' : `Confirmar (${selectedBlocos.size})`}
              disabled={confirming || selectedBlocos.size === 0}
              onClick={handleConfirmar}
            />
            <Button
              variant="secondary"
              label="Voltar"
              onClick={() => navigate('/scale/month')}
            />
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d9d9d9; border-radius: 10px; }
      `}</style>
    </div>
  );
}