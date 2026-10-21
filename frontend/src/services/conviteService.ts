import api from './api';

export interface Convite {
  token: string;
  id_colaborador: string;
  expira_em: string;
  usado: boolean;
  created_at: string;
}

export const conviteService = {
  criar: async (idColaborador: string, email: string, nome: string): Promise<void> => {
    await api.post('/convites', {
      id_colaborador: idColaborador,
      colaborador_email: email,
      colaborador_nome: nome,
    });
  },

  listar: async (): Promise<Convite[]> => {
    const response = await api.get('/convites');
    return response.data;
  },

  deletar: async (token: string): Promise<void> => {
    await api.delete(`/convites/${token}`);
  },
};
