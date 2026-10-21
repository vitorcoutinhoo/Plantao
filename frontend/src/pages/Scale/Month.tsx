import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dutyService } from '../../services/dutyService';
import { scaleService } from '../../services/scaleService';
import { collaboratorService } from '../../services/collaboratorService';

interface DayInfo {
  employee: string;
  holiday?: string;
}

export function Month() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dayData, setDayData] = useState<Record<string, DayInfo>>({});
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(currentDate);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const prevMonth = new Date(year, month, 0);
        const startDate = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-${String(prevMonth.getDate()).padStart(2, '0')}`;
        const nextDay = new Date(year, month + 1, 1);
        const endDate = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;

        const [plantoes, feriados] = await Promise.all([
          dutyService.getByPeriod(startDate, endDate),
          scaleService.getFeriados(year),
        ]);

        const colaboradoresCache: Record<string, string> = {};
        const result: Record<string, DayInfo> = {};

for (const p of (Array.isArray(plantoes) ? plantoes : [])) {
          const periodo = p.periodo as any;
          const inicioRaw: string = periodo?.Inicio ?? periodo?.inicio ?? '';
          const fimRaw: string = periodo?.Fim ?? periodo?.fim ?? '';
          if (!inicioRaw) continue;

          if (!colaboradoresCache[p.colaborador_id]) {
            try {
              const colab = await collaboratorService.getById(p.colaborador_id);
              colaboradoresCache[p.colaborador_id] = colab.nome;
            } catch {
              colaboradoresCache[p.colaborador_id] = '—';
            }
          }

          // Converte para data local ignorando timezone — pega só YYYY-MM-DD
          const toLocalDate = (iso: string) => {
            // Se tem offset (+HH:MM ou -HH:MM), converte manualmente para local
            const localStr = new Date(iso).toLocaleDateString('en-CA'); // YYYY-MM-DD no locale local
            return localStr;
          };

          const inicioDate = toLocalDate(inicioRaw);
          const fimDate = fimRaw ? toLocalDate(fimRaw) : inicioDate;

          const cursor = new Date(inicioDate + 'T12:00:00');
          const fimCursor = new Date(fimDate + 'T12:00:00');
          while (cursor <= fimCursor) {
            const dateKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
            result[dateKey] = { employee: colaboradoresCache[p.colaborador_id] };
            cursor.setDate(cursor.getDate() + 1);
          }
        }

        for (const f of (Array.isArray(feriados) ? feriados : [])) {
          const dateKey = f.data.split('T')[0];
          result[dateKey] = {
            employee: result[dateKey]?.employee ?? '',
            holiday: f.nome,
          };
        }

        setDayData(result);
      } catch {
        // mantém o calendário vazio em caso de erro
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getWeeks = () => {
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    for (let i = 0; i < firstDayIndex; i++) currentWeek.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }
    return weeks;
  };

  const weeks = getWeeks();
  const cellHeight = `calc((100dvh - 80px - 258px - ${weeks.length - 1}px) / ${weeks.length})`;

  return (
    <div className="p-4 md:p-6 bg-white font-inter flex flex-col" style={{ height: 'calc(100dvh - 80px)' }}>
      {/* HEADER */}
      <div className="flex items-center justify-center mb-4 max-w-5xl mx-auto w-full">
        <div className="text-center">
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Escala</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium">Controle de escalas de plantões.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col overflow-hidden">
        {/* NAVEGAÇÃO */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex gap-4 items-center font-bold text-gray-800">
            <ChevronLeft size={24} className="cursor-pointer hover:text-[#B5071A]" onClick={prevMonth} />
            <span className="text-lg md:text-xl">{capitalizedMonth} {year}</span>
            <ChevronRight size={24} className="cursor-pointer hover:text-[#B5071A]" onClick={nextMonth} />
          </div>
          <LayoutGrid className="text-[#B5071A] cursor-pointer" size={24} onClick={() => navigate('/scale/year')} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-grow">
            <Loader2 size={32} className="text-[#B5071A] animate-spin" />
          </div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="md:hidden flex-grow overflow-y-auto space-y-6 pb-24 custom-scrollbar">
              {weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="space-y-2">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">
                    Semana {weekIdx + 1}
                  </h3>
                  <div className="space-y-1">
                    {week.map((day, dayIdx) => {
                      if (!day) return null;
                      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const info = dayData[dateKey];
                      return (
                        <div key={dayIdx} className="flex items-center bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex flex-col items-center justify-center border-r border-gray-200 pr-4 mr-4 min-w-[45px]">
                            <span className="text-[10px] font-bold text-gray-400">{daysOfWeek[dayIdx]}</span>
                            <span className={`text-lg font-bold ${info?.holiday ? 'text-[#B5071A]' : 'text-gray-700'}`}>
                              {String(day).padStart(2, '0')}
                            </span>
                          </div>
                          <div className="flex-grow">
                            <p className={`text-sm font-bold ${info?.employee ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                              {info?.employee || 'A decidir'}
                            </p>
                            {info?.holiday && (
                              <span className="text-[9px] bg-[#B5071A]/10 text-[#B5071A] px-1.5 py-0.5 rounded font-bold uppercase">
                                {info.holiday}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP */}
            <div className="hidden md:block border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="grid grid-cols-7 bg-gray-100 gap-[1px]">
                {daysOfWeek.map(day => (
                  <div key={day} className="py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-gray-100 gap-[1px]">
                {weeks.flatMap(w => w).map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} style={{ height: cellHeight }} className="bg-white" />;
                  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const info = dayData[dateKey];
                  return (
                    <div key={i} style={{ height: cellHeight }} className={`p-2 flex flex-col justify-between transition-colors hover:bg-gray-50 ${info?.holiday ? 'bg-[#B5071A]/5' : 'bg-white'}`}>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xl font-bold leading-none ${info?.holiday ? 'text-[#B5071A]' : 'text-[#B8BEC7]'}`}>{day}</span>
                        {info?.holiday && (
                          <span className="text-[9px] font-bold text-[#B5071A] uppercase leading-tight line-clamp-2">
                            {info.holiday}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-semibold truncate ${info?.employee ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                        {info?.employee || 'A decidir'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* BOTÕES */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 md:relative md:border-none md:p-0 md:mt-4">

        <div className="max-w-5xl mx-auto w-full md:flex md:justify-end">
          <div className="grid grid-cols-3 gap-2 md:flex md:gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                const lastDay = new Date(year, month + 1, 0).getDate();
                const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                navigate(`/reports?start=${start}&end=${end}`);
              }}
              className="bg-[#B5071A] text-white py-3 md:px-8 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs shadow-md active:scale-95 transition-all"
            >
              Relatório
            </button>
            <button 
              onClick={() => navigate(`/scale/suggestion?year=${year}&month=${month + 1}`)} 
              className="bg-[#B5071A] text-white py-3 md:px-8 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs shadow-md active:scale-95 transition-all"
            >
              Sugestão
            </button>
            <button 
              onClick={() => navigate('/home')} 
              className="bg-[#1E293B] text-white py-3 md:px-8 md:py-2.5 rounded-xl font-bold text-[10px] md:text-xs shadow-md active:scale-95 transition-all"
            >
              Voltar
            </button>
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
