import api from './api';

export interface Feriado {
  id: string;
  data: string;
  nome: string;
  descricao: string;
}

export interface ConfigValor {
  tipo_dia: 'UTIL' | 'SABADO' | 'DOMINGO' | 'FERIADO';
  valor: number;
  descricao?: string;
}

export interface Cargo {
  id: string;
  nome: string;
}

export interface Setor {
  id: string;
  nome: string;
}

export const scaleService = {
  getFeriados: async (ano: number): Promise<Feriado[]> => {
    const response = await api.get('/admin/feriados', { params: { ano } });
    return response.data;
  },

  updateFeriado: async (id: string, novaData: string): Promise<Feriado> => {
    const response = await api.patch(`/admin/feriados/${id}/data`, { nova_data: novaData });
    return response.data;
  },

  getConfigValores: async (): Promise<ConfigValor[]> => {
    const response = await api.get('/admin/config-valores');
    return response.data;
  },

  createConfigValor: async (payload: {
    tipo_dia: ConfigValor['tipo_dia'];
    valor: number;
    descricao?: string;
  }): Promise<ConfigValor> => {
    const response = await api.post('/admin/config-valores', payload);
    return response.data;
  },

  getCargos: async (): Promise<Cargo[]> => {
    const response = await api.get('/cargos');
    return response.data;
  },

  createCargo: async (nome: string): Promise<Cargo> => {
    const response = await api.post('/admin/cargos', { nome });
    return response.data;
  },

  deleteCargo: async (id: string): Promise<void> => {
    await api.delete(`/admin/cargos/${id}`);
  },

  getSetores: async (): Promise<Setor[]> => {
    const response = await api.get('/setores');
    return response.data;
  },

  createSetor: async (nome: string): Promise<Setor> => {
    const response = await api.post('/admin/setores', { nome });
    return response.data;
  },

  deleteSetor: async (id: string): Promise<void> => {
    await api.delete(`/admin/setores/${id}`);
  },

  updateConfigValor: async (
    tipo_dia: ConfigValor['tipo_dia'],
    data: { valor: number; descricao?: string }
  ) => {
    const response = await api.patch(`/admin/config-valores/${tipo_dia}`, data);
    return response.data;
  }

};
