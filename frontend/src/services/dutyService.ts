import api from './api';
import axios from 'axios';

export interface Duty {
  id: string;
  colaborador_id: string;
  periodo: {
    Inicio: string;
    Fim: string;
  };
  status: string;
  valor_total: number;
  observacoes: string | null;
}

// 1. Nova interface para os filtros do relatório
export interface RelatorioFiltros {
  data_inicio: string;
  data_fim: string;
  colaborador_id?: string;
  status?: string | number;
}

export const dutyService = {
  getAll: async (): Promise<Duty[]> => {
    const response = await api.get('/plantoes');
    return response.data;
  },

  getById: async (id: string): Promise<Duty> => {
    const response = await api.get(`/plantoes/${id}`);
    return response.data;
  },

  getByColaborador: async (colaboradorId: string): Promise<Duty[]> => {
    try {
      const response = await api.get(`/plantoes/colaborador/${colaboradorId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  getByStatus: async (status: 'AGENDADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'PAGO'): Promise<Duty[]> => {
    const response = await api.get(`/plantoes/status/${status}`);
    return response.data;
  },

  getByPeriod: async (startDate: string, endDate: string): Promise<Duty[]> => {
    const response = await api.get(`/plantoes/periodo/${startDate}/${endDate}`);
    return response.data;
  },

  // 2. NOVO MÉTODO EXCLUSIVO PARA O RELATÓRIO
  getRelatorio: async (filtros: RelatorioFiltros): Promise<any[]> => {
    // Limpa os filtros vazios para não enviar "colaborador_id=" na URL
    const paramsLimpos = Object.fromEntries(
      Object.entries(filtros).filter(([_, v]) => v != null && v !== '')
    );

    // O Axios automaticamente converte o objeto paramsLimpos para ?data_inicio=X&data_fim=Y...
    const response = await api.get('/plantoes/relatorio', { params: paramsLimpos });
    return response.data;
  },

  create: async (payload: {
    colaborador_id: string;
    periodo: { inicio: string; fim: string };
  }): Promise<Duty> => {
    const response = await api.post('/plantoes', payload);
    return response.data;
  },

  updateStatus: async (id: string, newStatus: string | number, observacoes?: string): Promise<void> => {
    await api.patch(`/plantoes/${id}/status`, { new_status: newStatus, observacoes });
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/plantoes/${id}`);
  },

  pagar: async (id: string, observacoes?: string) => {
    const response = await api.post(`/plantoes/${id}/pagamento`, { observacoes });
    return response.data;
  },
  // atualiza o plantão com os dados fornecidos (colaborador_id, data_inicio, data_fim)
  update: async (id: string, payload: { colaborador_id: string; data_inicio: string; data_fim: string }): Promise<Duty> => {
    const response = await api.patch(`/plantoes/${id}`, payload);
    return response.data;
  },
};