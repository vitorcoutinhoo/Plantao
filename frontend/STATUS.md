# Status do Frontend — Intellisys Plantão

> Atualizado em 2026-05-26.

---

## Resumo Executivo

| Área | Status |
|---|---|
| Autenticação | ✅ Completo |
| Gestão de Plantões | ✅ Completo |
| Gestão de Colaboradores | ⚠️ Parcial — role `gerente` ignorado em Users/All |
| Gestão de Usuários & Convites | ⚠️ Parcial — falta reenvio de convite |
| Gestão Financeira | ✅ Completo — valores e feriados |
| Comunicação por Email | ⚠️ Parcial — formato dos tipos não confirmado com backend |
| Cargos, Setores & Roles | ❌ Falta — sem tela de gerenciamento |
| Proteção de Rotas | ✅ Completo — AdminRoute em todas as rotas admin |
| Sidebar | ✅ Completo — seções com links corretos por role |
| Infraestrutura / Build | ✅ Funcional |

---

## 1. Autenticação & Segurança ✅

| Feature | Status | Observação |
|---|---|---|
| Login JWT via cookie HTTP-only | ✅ | Cookie gerenciado pelo browser via `withCredentials: true` |
| Logout | ✅ | Limpa localStorage e redireciona |
| Cadastro via token de convite | ✅ | Fluxo completo em `/cadastro?token=` |
| Auto-logout em 401 | ✅ | Interceptor em `api.ts` |
| Bloqueio de inativo no login | ✅ | `Login.tsx` verifica `colaborador.status` após login |
| Proteção de rotas admin | ✅ | `AdminRoute` em todas as rotas de gestão |
| Roles: admin / gerente / colaborador | ⚠️ Parcial | `gerente` tem acesso via sidebar/AdminRoute, mas `Users/All.tsx` ainda usa `role === 'admin'` apenas |

---

## 2. Gestão de Plantões ✅

| Feature | Status | Observação |
|---|---|---|
| Criar plantão | ✅ | `Duty.tsx` — apenas admin/gerente |
| Listar todos | ✅ | `Duty.tsx` |
| Buscar por colaborador | ✅ | `Home.tsx` |
| Atualizar status | ✅ | Envia string numérica `"1"`, `"2"`, `"4"` conforme backend |
| Fluxo AGENDADO → EM_ANDAMENTO → CONCLUIDO | ✅ | Colaborador inicia e conclui em `Home.tsx` |
| Fluxo CONCLUIDO → PAGO | ✅ | Admin paga em `Duty.tsx` com botão "Pagar" |
| Deletar | ✅ | `Duty.tsx` |
| Colaborador não acessa `/duty` | ✅ | Redirecionado pelo `AdminRoute` |

**Observação:**
- Transição `EM_ANDAMENTO → CONCLUIDO` retorna 500 do backend (erro no backend, não no frontend — possivelmente cálculo de valor_total).

---

## 3. Gestão de Colaboradores ⚠️

| Feature | Status | Observação |
|---|---|---|
| CRUD completo | ✅ | `Users/Create`, `Edit`, `Details`, `All` |
| Upload de foto | ✅ | `collaboratorService.uploadFoto()` |
| Filtros por nome/email | ✅ | Busca local |
| Status `ativo/inativo` | ✅ | Ambos campos presentes |
| `gerente` pode gerenciar colaboradores | ❌ | `Users/All.tsx` linha 29 só libera `role === 'admin'` |
| Botão excluir colaborador | ❌ | `collaboratorService.delete()` existe mas sem botão na UI |

---

## 4. Gestão de Usuários & Convites ⚠️

| Feature | Status | Observação |
|---|---|---|
| Listar usuários (admin) | ✅ | `Permissions.tsx` |
| Alterar role | ✅ | `Permissions.tsx` |
| Criar convite | ✅ | `Users/All.tsx` |
| Listar convites | ✅ | `Convites.tsx` com status Pendente/Usado/Expirado |
| Revogar convite | ✅ | `Convites.tsx` |
| Reenviar convite | ❌ | Não implementado — seria deletar + recriar |
| Tela de perfil do usuário | ❌ | `authService.updateConta/desativarConta` existem mas sem tela |

---

## 5. Gestão Financeira ✅

| Feature | Status | Observação |
|---|---|---|
| Listar config de valores | ✅ | `Financeiro.tsx` aba Valores |
| Criar novo valor vigente | ✅ | Formulário com tipo_dia, valor, vigencia_inicio |
| Listar feriados por ano | ✅ | `Financeiro.tsx` aba Feriados com seletor de ano |
| Editar data de feriado | ✅ | Edição inline na tabela |

---

## 6. Comunicação por Email ⚠️

| Feature | Status | Observação |
|---|---|---|
| Criar template | ✅ | `ModeloComunicacao.tsx` |
| Listar templates | ✅ | |
| Editar template | ✅ | |
| 11 tipos de comunicação | ✅ | Todos os tipos no select |
| Tags dinâmicas | ✅ | UI documenta `{{.Nome}}`, `{{.Email}}`, `{{.DataInicio}}`, etc. |
| Formato dos tipos aceito pelo backend | ⚠️ | Não confirmado — valores PascalCase (`PlantaoAgendado` etc.) podem não bater com o backend |

---

## 7. Cargos, Setores & Roles ❌

| Feature | Status | Observação |
|---|---|---|
| Listar cargos/setores | ✅ | Usados nos formulários de colaborador |
| Criar/deletar cargo (admin) | ❌ | `scaleService.createCargo/deleteCargo` existem sem tela |
| Criar/deletar setor (admin) | ❌ | `scaleService.createSetor/deleteSetor` existem sem tela |

---

## O que Falta (priorizado)

| Item | Esforço | Serviço já existe? |
|---|---|---|
| Suporte a `gerente` em `Users/All.tsx` | Pequeno | ✅ |
| Reenvio de convite em `Convites.tsx` | Pequeno | ✅ `conviteService` |
| Tela de perfil do usuário | Pequeno | ✅ `authService.updateConta` |
| Botão excluir colaborador | Pequeno | ✅ `collaboratorService.delete()` |
| Confirmar formato de `tipo_comunicacao` com backend | Pequeno | — |
| Tela de Cargos e Setores | Médio | ✅ `scaleService` |