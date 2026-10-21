import { Document, Page, Text, View, Image, StyleSheet, Font } from '@react-pdf/renderer';

let fontsRegistered = false;
export function registerFonts() {
  if (fontsRegistered) return;
  const base = import.meta.env.BASE_URL;
  Font.register({
    family: 'Inter',
    fonts: [
      { src: `${base}/fonts/Inter-Regular.ttf`, fontWeight: 400 },
      { src: `${base}/fonts/Inter-Medium.ttf`, fontWeight: 500 },
      { src: `${base}/fonts/Inter-Bold.ttf`, fontWeight: 700 },
    ],
  });
  fontsRegistered = true;
}

export interface PlantaoDia {
  dataISO?: string;
  data: string;
  diaSemana: string;
  observacao: string;
  valor: number;
}

export interface PlantaoGroup {
  id: string;
  colaborador: string;
  periodoInicio: string;
  periodoFim: string;
  status: string;
  valorTotal: number;
  dias: PlantaoDia[];
  meses?: PlantaoMes[];
}

export interface PlantaoMes {
  chave: string;
  titulo: string;
  dias: PlantaoDia[];
}

interface ReportTemplateProps {
  plantoes: PlantaoGroup[];
  filtrosText: string;
  emitidoEm: string;
  logoBase64: string;
  quebrarPorMes?: boolean;
}

// const RED = '#B5071A';
const GRAY1 = '#111827';
// const GRAY4 = '#374151';
const GRAY5 = '#6b7280';
const GRAY9 = '#9ca3af';
const BORDER = '#e5e7eb';
// const ROW_ALT = '#f9fafb';
const FOOT_BG = '#f3f4f6';

const REGULAR = 'Inter';

const s = StyleSheet.create({
  page: {
    fontFamily: REGULAR, fontSize: 9, color: GRAY1,
    backgroundColor: '#fff', paddingHorizontal: 40, paddingTop: 32, paddingBottom: 52,
  },
  
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  logoImg: { height: 28 },
  // Removido o fontStyle: 'italic'
  headerTitle: { fontFamily: REGULAR, fontWeight: 700, fontSize: 16, color: GRAY1, flex: 1, textAlign: 'center', paddingTop: 6 },
  headerDate: { fontFamily: REGULAR, fontWeight: 700, fontSize: 8, color: GRAY1, paddingTop: 8 },
  
  filterLine: { borderBottomWidth: 1, borderBottomColor: GRAY5, paddingBottom: 6, marginBottom: 25 },
  filterText: { fontFamily: REGULAR, fontSize: 8.5, color: GRAY5 },
  filterLabel: { fontWeight: 700, color: GRAY1 },

  plantaoBlock: { marginBottom: 35 },
  monthTitle: { fontFamily: REGULAR, fontWeight: 700, fontSize: 10, color: GRAY5, marginBottom: 6, textTransform: 'uppercase' },
  
  metaContainer: { flexDirection: 'row', marginBottom: 15, paddingHorizontal: 15 },
  metaCol: { width: '50%', display: 'flex', flexDirection: 'column', gap: 6 },
  metaRow: { flexDirection: 'row' },
  metaLabel: { fontFamily: REGULAR, fontWeight: 700, fontSize: 9, color: GRAY1, width: 70, textAlign: 'right', marginRight: 8 },
  metaValue: { fontFamily: REGULAR, fontSize: 9, color: GRAY5 },

  // Removido o fontStyle: 'italic'
  tableTitle: { fontFamily: REGULAR, fontWeight: 700, fontSize: 12, color: GRAY5, textAlign: 'center', marginBottom: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: FOOT_BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  thCell: { fontFamily: REGULAR, fontWeight: 700, paddingVertical: 8, paddingHorizontal: 10, fontSize: 8.5, color: GRAY1 },
  
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDER },
  // Removido o fontStyle: 'italic'
  tdCell: { fontFamily: REGULAR, paddingVertical: 6, paddingHorizontal: 10, fontSize: 8.5, color: GRAY5 },
  tdRight: { textAlign: 'right' },

  tableFoot: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: GRAY1 },
  tfLabel: { fontFamily: REGULAR, fontWeight: 700, paddingVertical: 8, paddingHorizontal: 10, fontSize: 9, color: GRAY1, textAlign: 'right' },
  tfValue: { fontFamily: REGULAR, fontWeight: 700, paddingVertical: 8, paddingHorizontal: 10, fontSize: 9, color: GRAY1, textAlign: 'right' },

  signatureWrap: { marginTop: 35, alignItems: 'center' },
  signatureLine: { width: 220, borderTopWidth: 1, borderTopColor: GRAY5, marginBottom: 6 },
  signatureText: { fontFamily: REGULAR, fontSize: 8.5, color: GRAY5 },

  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, alignItems: 'center' },
  footerL2: { fontFamily: REGULAR, fontWeight: 400, fontSize: 6.5, color: GRAY9 },
});

const COL = { data: '20%', dia: '25%', obs: '40%', valor: '15%' };

export function ReportTemplate({ plantoes, filtrosText, emitidoEm, logoBase64, quebrarPorMes = false }: ReportTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        
        <View style={s.headerContainer}>
          {logoBase64 ? <Image style={s.logoImg} src={logoBase64} /> : <View style={{ width: 80 }} />}
          <Text style={s.headerTitle}>Relatório gerencial dos plantões</Text>
          <Text style={s.headerDate}>{emitidoEm.split(' às ')[0]}</Text>
        </View>

        <View style={s.filterLine}>
          <Text style={s.filterText}>
            <Text style={s.filterLabel}>Filtro: </Text>
            {filtrosText}
          </Text>
        </View>

        {plantoes.map((p, idx) => {
          const meses = quebrarPorMes && p.meses?.length
            ? p.meses
            : [{ chave: 'completo', titulo: '', dias: p.dias }];

          return meses.map((mes, indiceMes) => (
          <View key={`${idx}-${mes.chave}`} style={s.plantaoBlock} break={quebrarPorMes && indiceMes > 0} wrap={quebrarPorMes}>
            
            <View style={s.metaContainer}>
              <View style={s.metaCol}>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Plantão:</Text>
                  <Text style={s.metaValue}>{p.id}</Text>
                </View>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Funcionário:</Text>
                  <Text style={s.metaValue}>{p.colaborador}</Text>
                </View>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Valor:</Text>
                  <Text style={s.metaValue}>{p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Text>
                </View>
              </View>
              <View style={s.metaCol}>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Período:</Text>
                  <Text style={s.metaValue}>{p.periodoInicio} a {p.periodoFim}</Text>
                </View>
                <View style={s.metaRow}>
                  <Text style={s.metaLabel}>Status:</Text>
                  <Text style={s.metaValue}>{p.status}</Text>
                </View>
              </View>
            </View>

            <Text style={s.tableTitle}>{quebrarPorMes && indiceMes > 0 ? 'Continuação do Plantão' : 'Detalhamento do Plantão'}</Text>
            {quebrarPorMes && <Text style={s.monthTitle}>{mes.titulo}</Text>}
            <View>
              <View style={s.tableHeader}>
                <Text style={[s.thCell, { width: COL.data }]}>Data</Text>
                <Text style={[s.thCell, { width: COL.dia }]}>Dia da Semana</Text>
                <Text style={[s.thCell, { width: COL.obs }]}>Observação</Text>
                <Text style={[s.thCell, s.tdRight, { width: COL.valor }]}>Valor do Dia</Text>
              </View>

              {mes.dias.map((d, i) => (
                <View key={d.dataISO ?? i} style={s.tableRow}>
                  <Text style={[s.tdCell, { width: COL.data }]}>{d.data}</Text>
                  <Text style={[s.tdCell, { width: COL.dia }]}>{d.diaSemana}</Text>
                  <Text style={[s.tdCell, { width: COL.obs }]}>{d.observacao}</Text>
                  <Text style={[s.tdCell, s.tdRight, { width: COL.valor }]}>
                    {d.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}

              {indiceMes === meses.length - 1 && (
                <View style={s.tableFoot}>
                  <Text style={[s.tfLabel, { width: '85%' }]}>Valor Total</Text>
                  <Text style={[s.tfValue, { width: COL.valor }]}>
                    {p.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              )}
            </View>

            {indiceMes === meses.length - 1 && (
              <View style={s.signatureWrap}>
                <View style={s.signatureLine} />
                <Text style={s.signatureText}>{p.colaborador}</Text>
              </View>
            )}

          </View>
          ));
        })}

        <View style={s.footer} fixed>
          <Text style={s.footerL2}>Gerado automaticamente pelo sistema de gestão de plantões</Text>
        </View>
      </Page>
    </Document>
  );
}
