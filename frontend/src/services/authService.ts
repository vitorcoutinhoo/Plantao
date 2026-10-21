import api from './api';

export const authService = {
  login: async (credentials: { email: string; senha: string }) => {
    const response = await api.post('/auth/login', credentials);

    if (response.data.id) {
      localStorage.setItem('@Intellisys:user', JSON.stringify(response.data));

      const userAccount = response.data;
      if (userAccount.id_colaborador && userAccount.role?.toLowerCase() !== 'financeiro') {
        try {
          const colabResponse = await api.get(`/colaboradores/${userAccount.id_colaborador}`);
          localStorage.setItem('@Intellisys:colaborador', JSON.stringify(colabResponse.data));
        } catch (error) {
          console.error('Erro ao buscar dados do colaborador após login', error);
        }
      }
    }

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('@Intellisys:user');
    localStorage.removeItem('@Intellisys:colaborador');
  },

  getUsuario: async () => {
    const response = await api.get('/authenticated/usuarios');
    const current = localStorage.getItem('@Intellisys:user');
    const merged = { ...(current ? JSON.parse(current) : {}), ...response.data };
    localStorage.setItem('@Intellisys:user', JSON.stringify(merged));
    return response.data;
  },

  getColaborador: async (colaboradorId: string) => {
    const response = await api.get(`/colaboradores/${colaboradorId}`);
    localStorage.setItem('@Intellisys:colaborador', JSON.stringify(response.data));
    return response.data;
  },

  cadastro: async (token: string, senha: string): Promise<void> => {
    await api.post(`/usuarios/cadastro?token=${token}`, { senha });
  },

  updateConta: async (data: { email?: string; senha?: string }): Promise<void> => {
    await api.put('/authenticated/usuarios', data);
  },

  desativarConta: async (): Promise<void> => {
    await api.delete('/authenticated/usuarios');
  },

  listarUsuarios: async (): Promise<any[]> => {
    const response = await api.get('/admin/all');
    return response.data;
  },

  atualizarRole: async (userId: string, role: string): Promise<void> => {
    await api.patch(`/admin/usuarios/${userId}/role`, { role });
  },
};
