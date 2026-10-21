import api from './api';

export interface Collaborator {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  setor: string;
  foto_url?: string;
  status: 'ativo' | 'inativo';
  ativo_plantao: 'ativo' | 'inativo';
  data_admissao: string;
}

export interface UserAccount {
  id: string;
  id_colaborador: string;
  email: string;
  role: 'admin' | 'gerente' | 'colaborador';
  ativo: 'ativo' | 'inativo';
}

function normalize(data: any): Collaborator {
  return {
    ...data,
    status: data.status?.toLowerCase() ?? 'ativo',
    ativo_plantao: data.ativo_plantao?.toLowerCase() ?? 'inativo',
  };
}

export const collaboratorService = {
  getAll: async (): Promise<Collaborator[]> => {
    const response = await api.get('/colaboradores');
    return response.data.map(normalize);
  },

  getById: async (id: string): Promise<Collaborator> => {
    const response = await api.get(`/colaboradores/${id}`);
    return normalize(response.data);
  },

  create: async (data: Omit<Collaborator, 'id' | 'foto_url'>): Promise<Collaborator> => {
    const response = await api.post('/colaboradores', data);
    return normalize(response.data);
  },

  uploadFoto: async (id: string, file: File): Promise<void> => {
    const form = new FormData();
    form.append('foto', file);
    await api.patch(`/colaboradores/${id}/foto`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: async (id: string, data: Partial<Collaborator>): Promise<void> => {
    await api.patch(`/colaboradores/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/colaboradores/${id}`);
  },
};
