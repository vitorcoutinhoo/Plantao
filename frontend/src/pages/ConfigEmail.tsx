import { useState, useEffect } from 'react';
import { Loader2, Save, Mail, Server, Key, AtSign, Eye, EyeOff } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Button } from '../components/Button';
import  api  from '../services/api';

const SMTP_CONFIG_ENDPOINT = '/admin/config-smtp';

type SmtpConfigForm = {
  smtp_host: string;
  smtp_port: number | string;
  smtp_username: string;
  smtp_password: string;
  smtp_from: string;
};

const emptyForm: SmtpConfigForm = {
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_from: ''
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasSmtpConfig(data: unknown) {
  if (!isRecord(data)) return false;

  return Boolean(
    data.id ||
    data.smtp_host ||
    data.smtp_username ||
    data.smtp_from
  );
}

function getResponseStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined;
}

function getResponseMessage(error: unknown) {
  if (!isAxiosError(error)) return undefined;

  const data = error.response?.data;
  if (!isRecord(data)) return undefined;

  return (
    typeof data.error === 'string' ? data.error :
    typeof data.message === 'string' ? data.message :
    undefined
  );
}

export function ConfigEmail() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [exists, setExists] = useState(false); // Define se vamos usar POST ou PATCH

  const [form, setForm] = useState<SmtpConfigForm>(emptyForm);

  // Busca as configurações atuais ao carregar a página
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data } = await api.get(SMTP_CONFIG_ENDPOINT);
        if (hasSmtpConfig(data)) {
          setForm({
            smtp_host: data.smtp_host || '',
            smtp_port: data.smtp_port || 587,
            smtp_username: data.smtp_username || '',
            smtp_password: data.smtp_password || '',
            smtp_from: data.smtp_from || ''
          });
          setExists(true); // Já existe, então futuras edições serão PATCH
        } else {
          setExists(false);
        }
      } catch (err: unknown) {
        // Se retornar 404, significa que não tem configuração ainda (o que é esperado na primeira vez)
        if (getResponseStatus(err) !== 404) {
          console.error('Erro ao carregar configurações de e-mail', err);
        }
        setExists(false);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    
    // Converte a porta para número antes de enviar
    const payload = {
      ...form,
      smtp_port: Number(form.smtp_port)
    };

    try {
      if (exists) {
        await api.patch(SMTP_CONFIG_ENDPOINT, payload);
        alert('Configurações de e-mail atualizadas com sucesso!');
      } else {
        await api.post(SMTP_CONFIG_ENDPOINT, payload);
        alert('Configurações de e-mail salvas com sucesso!');
        setExists(true);
      }
    } catch (err: unknown) {
      const status = getResponseStatus(err);
      let saveError = err;

      try {
        if (!exists && (status === 400 || status === 409)) {
          await api.patch(SMTP_CONFIG_ENDPOINT, payload);
          setExists(true);
          alert('Configurações de e-mail atualizadas com sucesso!');
          return;
        }

        if (exists && status === 404) {
          await api.post(SMTP_CONFIG_ENDPOINT, payload);
          setExists(true);
          alert('Configurações de e-mail salvas com sucesso!');
          return;
        }
      } catch (retryErr: unknown) {
        saveError = retryErr;
      }

      const errorMsg = getResponseMessage(saveError) || 'Erro ao salvar configurações.';
      alert(`Erro: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 min-h-screen">
        <Loader2 size={28} className="text-[#B5071A] animate-spin" />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 bg-white min-h-full font-inter flex flex-col">
      <div className="flex flex-col items-center mb-6 md:mb-8 max-w-2xl mx-auto w-full">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 bg-red-50 text-[#B5071A] rounded-2xl flex items-center justify-center">
              <Mail size={24} />
            </div>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-[#B5071A]">Configuração de Servidor SMTP</h2>
          <p className="text-[10px] md:text-sm text-gray-500 font-medium mt-1">
            Defina as credenciais para o envio de e-mails do sistema (substitui o arquivo .env).
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <form onSubmit={handleSave} className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 md:p-8 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 flex items-center gap-1.5">
                <Server size={12} /> SMTP Host
              </label>
              <input
                type="text"
                name="smtp_host"
                required
                value={form.smtp_host}
                onChange={handleChange}
                placeholder="Ex: smtp.gmail.com"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-colors bg-gray-50/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase ml-1">Porta</label>
              <input
                type="number"
                name="smtp_port"
                required
                value={form.smtp_port}
                onChange={handleChange}
                placeholder="587"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-colors bg-gray-50/50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 flex items-center gap-1.5">
              <AtSign size={12} /> E-mail de Autenticação (Username)
            </label>
            <input
              type="email"
              name="smtp_username"
              required
              value={form.smtp_username}
              onChange={handleChange}
              placeholder="Ex: seuemail@gmail.com"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-colors bg-gray-50/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 flex items-center gap-1.5">
              <Key size={12} /> Senha do E-mail (App Password)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="smtp_password"
                required
                value={form.smtp_password}
                onChange={handleChange}
                placeholder="Insira a senha gerada pelo provedor"
                className="w-full h-11 px-4 pr-12 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-colors bg-gray-50/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#B5071A] transition-colors"
                title={showPassword ? "Ocultar senha" : "Ver senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span className="text-[10px] text-gray-400 ml-1">Para Gmail, use uma "Senha de App" e não a senha principal da conta.</span>
          </div>

          <div className="flex flex-col gap-1.5 pt-4 border-t border-gray-100">
            <label className="text-[10px] text-gray-400 font-bold uppercase ml-1 flex items-center gap-1.5">
              <Mail size={12} /> E-mail Remetente (De:)
            </label>
            <input
              type="email"
              name="smtp_from"
              required
              value={form.smtp_from}
              onChange={handleChange}
              placeholder="Ex: noreply@suaempresa.com"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 focus:border-[#B5071A] outline-none transition-colors bg-gray-50/50"
            />
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <Button
                type="submit"
                disabled={saving}
                label={saving ? 'Salvando...' : 'Salvar Configurações'}
                icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                size="lg"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
