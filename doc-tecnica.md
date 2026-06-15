# Documentação Técnica — Sistema de Atendimento

**Versão:** 1.0  
**Data:** 02/05/2026  
**Status:** Em produção (ambiente local + ngrok)

---

## 1. Visão Geral do Sistema

Sistema web interno de atendimento via e-mail, com interface Kanban, controle de SLA em horas úteis, painel de métricas e gestão de operadores. Construído em Next.js com banco PostgreSQL, autenticação via Microsoft Entra ID (Azure AD) e integração de e-mail via Gmail IMAP/SMTP.

**Acesso local:** `http://localhost:3000`  
**Acesso externo (ngrok):** `https://concerned-citric-coastal.ngrok-free.dev`

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| Linguagem | TypeScript | 5 |
| Estilização | Tailwind CSS | 4 |
| Banco de dados | PostgreSQL | local via Docker |
| ORM | Prisma | 7.8.0 |
| Autenticação | NextAuth.js + Azure AD | 5.0.0-beta.31 |
| Leitura de e-mail | ImapFlow (IMAP) | 1.3.x |
| Envio de e-mail | Nodemailer (SMTP) | 7.x |
| Parser de e-mail | Mailparser | 3.x |
| Editor de texto | TipTap | 3.22.x |
| Drag & Drop | @dnd-kit/core | 6.3.x |
| Gráficos | Recharts | 3.8.x |
| Tema dark/light | next-themes | 0.4.x |
| CSV parse | PapaParse | 5.x |

> **Nota:** O PRD original previa Microsoft Graph API para e-mail. Após testes, foi adotado Gmail IMAP/SMTP pela simplicidade de configuração no ambiente atual.

---

## 3. Estrutura de Arquivos

```
atendimento/
├── app/                        # Next.js App Router
│   ├── globals.css             # Estilos globais + Tailwind v4
│   ├── layout.tsx              # Layout raiz com provedor de tema
│   ├── page.tsx                # Redirect para /painel
│   ├── login/page.tsx          # Tela de login Microsoft
│   ├── aguardando-aprovacao/   # Tela de status pendente
│   ├── painel/
│   │   ├── page.tsx            # Quadro Kanban principal
│   │   ├── admin/page.tsx      # Painel administrativo
│   │   ├── relatorios/page.tsx # Dashboard de métricas
│   │   ├── configuracoes/      # Configurações do usuário
│   │   └── chamados/[id]/      # Detalhe do chamado
│   └── api/                    # Endpoints REST
│
├── componentes/
│   ├── kanban/                 # Quadro, colunas, cartões
│   ├── chamado/                # Detalhe, editor, modal novo
│   ├── admin/                  # Painel admin, editor assinatura
│   └── relatorios/             # Dashboard de métricas
│
├── lib/
│   ├── prisma.ts               # Singleton do cliente Prisma
│   ├── sla.ts                  # Cálculo de SLA em horas úteis
│   └── email/
│       ├── imap.ts             # Leitura de e-mails via IMAP
│       ├── enviar.ts           # Envio via SMTP
│       ├── sincronizar.ts      # Processamento de e-mails recebidos
│       ├── polling.ts          # Loop de polling (modo dev)
│       └── tokens.ts           # Refresh de tokens OAuth
│
├── prisma/
│   ├── schema.prisma           # Definição do banco
│   ├── seed.ts                 # Dados iniciais
│   └── migrations/             # Histórico de migrações
│
├── scripts/
│   ├── limpar-banco.ts         # Limpa todos os dados
│   ├── polling.ts              # Inicia polling manualmente
│   └── testar-email.ts         # Testa conexão IMAP
│
├── auth.ts                     # Configuração NextAuth
├── auth.config.ts              # Providers e callbacks
├── proxy.ts                    # Proxy reverso (modo dev)
├── vercel.json                 # Cron jobs para produção
└── docker-compose.yml          # PostgreSQL local
```

---

## 4. Banco de Dados

### 4.1 Diagrama de Relações

```
Usuario ──────────────────────────────────────────────────────┐
  │ (responsavel)                                              │
  ▼                                                           │
Chamado ──── ColunaKanban                                     │
  │   │ ─── Prioridade                                        │
  │   │ ─── Categoria ──── RegraCategoria                     │
  │   │                └── AtribuicaoCategoria ── Usuario      │
  │   │                                                        │
  │   ├── ParticipanteChamado ── Cliente                      │
  │   │       └── adicionadoPor → Usuario ───────────────────┘
  │   │
  │   └── MensagemEmail
  │           ├── DestinatarioMensagem
  │           └── AnexoMensagem

HorarioAtendimento    (7 registros, um por dia da semana)
ConfiguracaoEmail     (tokens OAuth do Gmail)
AssinaturaEmail ───── Usuario
TemplateEmail
```

---

### 4.2 Tabelas Detalhadas

#### `Usuario`
| Campo | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | Chave primária |
| nome | String | Nome completo |
| email | String (unique) | E-mail corporativo |
| cargo | Enum: ADM/HC | Nível de acesso |
| status | Enum: PENDENTE/ATIVO/INATIVO | Estado da conta |
| microsoftId | String? (unique) | ID no Azure AD |
| imagem | String? | URL da foto do perfil |
| criadoEm/atualizadoEm | DateTime | Auditoria |

**Fluxo de acesso:** Primeiro login cria o usuário com `status = PENDENTE`. ADM aprova via painel → `status = ATIVO`. Usuário inativo não consegue entrar.

---

#### `Chamado`
| Campo | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | Chave primária |
| assunto | String | Assunto do e-mail/chamado |
| responsavelId | String? | FK → Usuario |
| colunaId | String | FK → ColunaKanban (atual) |
| colunaAnteriorId | String? | Salva coluna antes de "Aguardando Cliente" |
| prioridadeId | String? | FK → Prioridade |
| categoriaId | String? | FK → Categoria |
| threadId | String? (unique) | Message-ID do e-mail inicial (agrupa thread) |
| prazoSla | DateTime? | Deadline calculado em horas úteis |
| slaPausadoEm | DateTime? | Timestamp quando SLA foi pausado (agente respondeu) |
| resolvidoEm | DateTime? | Timestamp da resolução |
| origem | Enum: RECEBIDO/INICIADO | E-mail recebido vs criado pelo operador |
| criadoEm/atualizadoEm | DateTime | Auditoria |

**Campos críticos para SLA:**
- `prazoSla`: calculado ao criar com `calcularPrazoSla(agora, prioridade.horasSla, horarios)`
- `slaPausadoEm`: preenchido quando agente responde (SLA pausa). Zerado quando cliente responde
- `resolvidoEm`: preenchido ao resolver. Quando preenchido, SLA para de ser exibido

---

#### `MensagemEmail`
| Campo | Tipo | Descrição |
|---|---|---|
| id | String (cuid) | Chave primária |
| chamadoId | String | FK → Chamado |
| deEmail | String | Remetente |
| deNome | String? | Nome do remetente |
| conteudoHtml | Text | Corpo do e-mail em HTML |
| direcao | Enum: ENTRADA/SAIDA | Recebido vs enviado |
| graphMensagemId | String? (unique) | ID do Microsoft Graph (legado) |
| messageId | String? (unique) | Message-ID do cabeçalho SMTP (dedup) |
| encaminhamento | Boolean | Flag de forward |
| enviadoEm | DateTime | Data/hora da mensagem |

**Deduplicação:** O campo `messageId` com constraint `@unique` evita duplicação ao sincronizar o mesmo e-mail mais de uma vez.

---

#### `ParticipanteChamado`
| Campo | Tipo | Descrição |
|---|---|---|
| chamadoId | String | FK → Chamado |
| clienteId | String | FK → Cliente |
| tipo | Enum: PARA/CC/CCO | Tipo de destinatário |
| adicionadoPorId | String? | FK → Usuario |
| removidoEm | DateTime? | Soft delete |

Constraint única: `(chamadoId, clienteId, tipo)` — mesmo cliente não aparece duas vezes no mesmo tipo.

---

#### `ColunaKanban`
| Campo | Tipo | Descrição |
|---|---|---|
| nome | String | Label da coluna |
| ordem | Int | Posição no quadro |
| cor | String | Hex color (#6366f1) |
| padrao | Boolean | Coluna inicial para novos chamados |
| resolvido | Boolean | Se `true`, chamados nessa coluna são tratados como resolvidos |

**Colunas padrão criadas no seed:**
1. Novo (padrao=true)
2. Atribuído
3. Em Atendimento
4. Aguardando Cliente
5. Resolvido (resolvido=true)

---

#### `Prioridade`
| Campo | Tipo | Descrição |
|---|---|---|
| nome | String | Ex: "Urgente", "Normal" |
| horasSla | Int | Horas úteis para prazo |
| cor | String | Hex color do badge |
| ordem | Int | Ordem de exibição |

---

#### `HorarioAtendimento`
| Campo | Tipo | Descrição |
|---|---|---|
| diaSemana | Int | 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb |
| horaInicio | String | Ex: "08:00" |
| horaFim | String | Ex: "18:00" |
| ativo | Boolean | Se `false`, dia não conta como útil |

Sempre 7 registros. Criados automaticamente pelo GET `/api/admin/horarios` se não existirem.

---

#### `RegraCategoria`
| Campo | Tipo | Descrição |
|---|---|---|
| palavraChave | String | Busca case-insensitive no assunto |
| categoriaId | String | FK → Categoria |

Ao criar chamado por e-mail recebido, o sistema verifica se o assunto contém alguma palavra-chave e atribui a categoria automaticamente.

---

#### `ConfiguracaoEmail`
| Campo | Tipo | Descrição |
|---|---|---|
| caixaEmail | String | Endereço da caixa monitorada |
| accessToken | Text | Token OAuth atual |
| refreshToken | Text | Token para renovação |
| expiresAt | DateTime | Expiração do accessToken |

---

## 5. Sistema de SLA

### 5.1 Lógica Central (`lib/sla.ts`)

O arquivo exporta duas funções puras:

#### `calcularPrazoSla(inicio, horas, horarios)`
Avança N horas úteis a partir de `inicio`, respeitando os horários configurados.

**Algoritmo:**
1. Converte horas em minutos restantes
2. Itera dia a dia (máximo 365 dias)
3. Se o dia não está ativo (`ativo = false`), pula para o próximo dia
4. Se o cursor está antes do início do expediente, avança para o início
5. Se o cursor está após o fim do expediente, pula para o próximo dia
6. Calcula minutos disponíveis no dia: `(horaFim - cursor)`
7. Se `minutosRestantes ≤ minutosDisponiveis`: retorna `cursor + minutosRestantes`
8. Caso contrário: subtrai disponíveis, avança para próximo dia
9. **Fallback:** se nenhum horário ativo, soma horas corridas (wall clock)

#### `calcularHorasUteisEntre(inicio, fim, horarios)`
Mede quantas horas úteis passaram entre dois instantes.

**Algoritmo:**
1. Itera dia a dia de `inicio` até `fim`
2. Para cada dia ativo: calcula a interseção entre `[inicio, fim]` e `[diaInicio, diaFim]`
3. Soma todos os milissegundos de interseção
4. Retorna `totalMs / 3.600.000`
5. **Fallback:** diferença em horas corridas se sem horários ativos

---

### 5.2 Ciclo de Vida do SLA no Chamado

```
[E-mail recebido]
       │
       ▼
 criarNovoChamado()
 prazoSla = calcularPrazoSla(agora, prioridade.horasSla, horarios)
 slaPausadoEm = null
       │
       ▼
[Agente responde via /api/chamados/[id]/responder]
 slaPausadoEm = agora            ← SLA pausado
 coluna → "Aguardando Cliente"
       │
       ▼
[Cliente responde por e-mail — detectado por sincronizarEmails()]
 horasPausadas = calcularHorasUteisEntre(slaPausadoEm, agora, horarios)
 prazoSla = calcularPrazoSla(prazoSla, horasPausadas, horarios)  ← prazo estendido
 slaPausadoEm = null             ← SLA retomado
 coluna → "Atribuído"
       │
       ▼
[Agente resolve via /api/chamados/[id]/resolver]
 resolvidoEm = agora             ← SLA congela, badge some
 coluna → "Resolvido"
```

---

### 5.3 Indicadores Visuais (cartão Kanban)

| Status | Condição | Visual |
|---|---|---|
| Nenhum | Sem prazoSla, ou resolvidoEm preenchido, ou coluna.resolvido=true | Oculto |
| `ok` | Mais de 8h restantes | Oculto (sem badge) |
| `atencao` | Entre 2h e 8h restantes | Badge amarelo "SLA próximo" |
| `critico` | Menos de 2h restantes | Badge laranja "SLA crítico" |
| `vencido` | Prazo ultrapassado | Badge vermelho "SLA vencido" |

---

## 6. Sincronização de E-mails

### 6.1 Fluxo (`lib/email/sincronizar.ts`)

```
sincronizarEmails()
    │
    ├─ lerEmailsNaoLidos()  [IMAP — imapflow]
    │       Retorna: { deEmail, deNome, assunto, threadId,
    │                  inReplyTo, messageId, conteudoHtml,
    │                  para[], cc[], dataRecebimento }
    │
    └─ Para cada mensagem:
            │
            ├─ Busca chamado por threadId
            │
            ├─ Fallback: busca MensagemEmail pelo inReplyTo
            │            (cobre respostas a e-mails enviados pelo sistema)
            │
            ├─ [Chamado encontrado]
            │       adicionarMensagem()   → dedup por messageId
            │       moverSeAguardando()   → se estava em "Aguardando Cliente":
            │                               retoma SLA, move para "Atribuído"
            │
            └─ [Chamado não encontrado]
                    criarNovoChamado()
                    ├─ upsert Cliente (por email)
                    ├─ coluna inicial (padrao=true)
                    ├─ prazo SLA com horários
                    ├─ participantes (para + cc)
                    ├─ primeira mensagem
                    └─ auto-categorização por RegraCategoria
```

### 6.2 Disparo da Sincronização

- **Desenvolvimento:** `npm run polling` → loop a cada 60s (`scripts/polling.ts`)
- **Produção (Vercel):** cron job a cada 2 minutos → `GET /api/sincronizar`
- **Manual:** `GET /api/email/sincronizar` (painel admin ou Postman)

---

## 7. API Endpoints

### Chamados
| Método | Endpoint | Ação |
|---|---|---|
| POST | `/api/chamados/novo` | Cria chamado manual |
| GET | `/api/chamados/buscar` | Busca por texto |
| POST | `/api/chamados/[id]/atribuir` | Atribui responsável |
| PATCH | `/api/chamados/[id]/categoria` | Altera categoria |
| GET | `/api/chamados/[id]/mensagens` | Lista mensagens |
| POST | `/api/chamados/[id]/mover` | Move de coluna |
| POST | `/api/chamados/[id]/pausar` | Pausa chamado |
| POST | `/api/chamados/[id]/resolver` | Marca como resolvido |
| POST | `/api/chamados/[id]/responder` | Envia resposta por e-mail |

### Admin (cargo ADM obrigatório)
| Método | Endpoint | Ação |
|---|---|---|
| GET/POST | `/api/admin/usuarios` | Lista / cria usuário |
| PATCH/DELETE | `/api/admin/usuarios/[id]` | Aprova / inativa |
| GET/POST | `/api/admin/categorias` | CRUD categorias |
| PATCH/DELETE | `/api/admin/categorias/[id]` | |
| GET/POST | `/api/admin/prioridades` | CRUD prioridades |
| PATCH/DELETE | `/api/admin/prioridades/[id]` | |
| GET/PUT | `/api/admin/horarios` | Horários de atendimento (SLA) |
| GET/POST | `/api/admin/colunas` | CRUD colunas Kanban |
| PATCH/DELETE | `/api/admin/colunas/[id]` | |
| GET/POST | `/api/admin/regras` | Regras de auto-categorização |
| DELETE | `/api/admin/regras/[id]` | |
| POST | `/api/admin/clientes/importar` | Importa clientes via CSV |

### E-mail
| Método | Endpoint | Ação |
|---|---|---|
| GET | `/api/email/conectar` | Inicia OAuth Gmail |
| GET | `/api/email/callback` | Callback OAuth |
| GET | `/api/email/sincronizar` | Dispara sincronização manual |

### Outros
| Método | Endpoint | Ação |
|---|---|---|
| GET | `/api/kanban/estado` | Estado completo do quadro (chamados por coluna) |
| GET | `/api/relatorios` | Dados do dashboard (com filtros por query string) |
| GET | `/api/sincronizar` | Endpoint do cron Vercel |
| GET | `/api/colunas` | Lista colunas públicas |
| GET | `/api/usuarios` | Lista usuários ativos |
| GET | `/api/clientes/buscar` | Busca cliente por email/nome |
| GET/POST | `/api/templates` | Templates de e-mail |
| GET/POST | `/api/assinaturas` | Assinaturas de e-mail |

---

## 8. Componentes Principais

### `componentes/kanban/`

**`quadro.tsx`**  
Componente raiz do Kanban. Usa `DndContext` do @dnd-kit. Gerencia o estado de arrasto (`arrastando`) e chama `/api/chamados/[id]/mover` ao soltar um cartão em outra coluna.

**`coluna-kanban.tsx`**  
Cada coluna usa `useDroppable`. Recebe o array de chamados e renderiza `CartaoChamado` para cada um. Passa `colunaResolvida={coluna.resolvido}` para suprimir badges de SLA em chamados já resolvidos.

**`cartao-chamado.tsx`**  
Usa `useDraggable`. Distingue clique de arrasto: registra `onPointerDown` e só navega para o detalhe se o mouse moveu menos de 5px. Calcula e exibe badge de SLA via `calcularStatusSla`.

---

### `componentes/chamado/`

**`detalhe-chamado.tsx`**  
Página completa do chamado. Divide-se em:
- **Coluna esquerda:** thread de mensagens em ordem cronológica, com separador visual por direção (entrada/saída)
- **Coluna direita (sidebar):** metadados (prioridade, categoria, responsável, SLA, resolvidoEm), botão de resolução
- **Rodapé:** editor de resposta (`EditorResposta`)

Quando `resolvidoEm` está preenchido, exibe a data de resolução em verde na sidebar e não mostra o badge de SLA vencido.

**`editor-resposta.tsx`**  
Editor TipTap com toolbar (negrito, itálico, sublinhado, listas, links, imagens). Suporta seleção de assinatura e template. Envia via `FormData` para suportar anexos binários.

---

### `componentes/relatorios/relatorios-dashboard.tsx`

Dashboard completo com:
- **Barra de filtros:** botões de período (7/30/90 dias) + selects de operador, categoria, prioridade
- **6 cards de métricas:** abertos, em andamento, resolvidos, SLA vencido, tempo médio de resposta, tempo médio de resolução
- **Gráfico de barras:** volume por dia (Recharts BarChart)
- **Tabela de operadores:** total e resolvidos por operador
- **Gráfico de pizza:** distribuição por categoria (PieChart)
- **Barras de prioridade:** volume relativo por prioridade
- **Painel vermelho de SLA vencido:** lista com links diretos para cada chamado
- **Exportação:** CSV (com BOM para Excel) e PDF via `window.print()`

---

### `componentes/admin/painel-admin.tsx`

Painel de abas para ADM:
- **Usuários:** aprova (PENDENTE→ATIVO), inativa, lista todos
- **Categorias:** CRUD + atribuição por operador + regras de palavras-chave
- **Prioridades:** CRUD com horas de SLA e cor
- **Colunas:** CRUD com ordem e cor + flag resolvido
- **Horários SLA:** grid de 7 dias com checkbox ativo + inputs de horário
- **Templates:** CRUD de templates de e-mail
- **Assinaturas:** gerencia assinaturas por operador

---

## 9. Autenticação

**Provedor:** Microsoft Entra ID (Azure AD) via NextAuth v5  
**Adapter:** `@auth/prisma-adapter` — persiste sessões e contas no banco

**Fluxo:**
1. Usuário acessa `/login` → clica em "Entrar com Microsoft"
2. Redireciona para Azure AD → autentica → callback em `/api/auth/callback/microsoft-entra-id`
3. NextAuth cria/atualiza `Usuario` e `Conta` no banco
4. Se `status = PENDENTE` → redireciona para `/aguardando-aprovacao`
5. Se `status = ATIVO` → acessa `/painel`

**Variáveis necessárias:**
```
AZURE_AD_CLIENT_ID
AZURE_AD_CLIENT_SECRET
AZURE_AD_TENANT_ID
NEXTAUTH_SECRET
NEXTAUTH_URL   ← deve bater com a URL real acessada pelo browser
```

---

## 10. Dark Mode

Implementado via Tailwind CSS v4 com classes manuais (`dark:`).

**Como funciona:**
- `next-themes` injeta a classe `dark` na tag `<html>` quando o modo escuro está ativo
- Tailwind v4 usa `@variant dark (&:where(.dark, .dark *))` — qualquer elemento descendente de `.dark` recebe os estilos `dark:`
- O botão de alternância (`componentes/toggle-tema.tsx`) chama `setTheme("dark")` ou `setTheme("light")`

**Problema resolvido:** `globals.css` tinha `body { background: var(--background) }` que sempre aplicava fundo branco, sobrepondo os estilos `dark:bg-gray-950`. A remoção dessa linha resolveu o problema.

---

## 11. Deploy

### Desenvolvimento Local

```bash
# Banco de dados
docker compose up -d

# Aplicação
npm run dev

# Sincronização de e-mails (terminal separado)
npm run polling
```

### Acesso externo (ngrok)

```bash
ngrok http 3000 --pooling-enabled
```

Atualizar `NEXTAUTH_URL` no `.env` e adicionar a URL como Redirect URI no Azure AD:
```
https://<url>.ngrok-free.app/api/auth/callback/microsoft-entra-id
```

### Produção (Vercel + Neon)

**Build script** (`package.json`):
```
prisma generate && prisma migrate deploy && next build
```

**Cron** (`vercel.json`):
```json
{ "crons": [{ "path": "/api/sincronizar", "schedule": "*/2 * * * *" }] }
```

**Variáveis de ambiente necessárias na Vercel:**
- `DATABASE_URL` (Neon connection string)
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`
- `GMAIL_USUARIO`, `GMAIL_SENHA_APP`
- `CAIXA_EMAIL_COMPARTILHADA`

---

## 12. Scripts Utilitários

| Script | Comando | Descrição |
|---|---|---|
| Polling manual | `npm run polling` | Loop de sincronização IMAP em dev |
| Seed | `npm run seed` | Popula dados iniciais (colunas, prioridades) |
| Limpar banco | `npx tsx scripts/limpar-banco.ts` | Remove todos os dados (preserva estrutura) |
| Testar e-mail | `npx tsx scripts/testar-email.ts` | Testa conexão IMAP |

---

## 13. Migrações do Banco

| Migration | Data | O que fez |
|---|---|---|
| `20260501173256_inicio` | 01/05 | Schema inicial completo |
| `20260501182404_email_config` | 01/05 | Tabela ConfiguracaoEmail |
| `20260501200000_add_message_id` | 01/05 | Campo messageId em MensagemEmail |
| `20260502031221_add_regra_categoria_e_resolvido_em` | 02/05 | RegraCategoria + resolvidoEm em Chamado |
| `20260502154535_add_sla_horario` | 02/05 | slaPausadoEm em Chamado + HorarioAtendimento |

---

## 14. O Que Está Funcionando (v1)

- [x] Login SSO Microsoft (Azure AD)
- [x] Fluxo de aprovação de usuários (PENDENTE → ATIVO)
- [x] Quadro Kanban com drag & drop
- [x] Recebimento automático de e-mails via IMAP (Gmail)
- [x] Agrupamento por thread (Message-ID)
- [x] Deduplicação de mensagens
- [x] Criação automática de clientes
- [x] Auto-categorização por palavras-chave
- [x] Resposta de e-mails com histórico de thread
- [x] Resolução de chamados (com timestamp)
- [x] SLA em horas úteis com horário configurável
- [x] Pausa e retomada de SLA (agente responde / cliente responde)
- [x] Badges visuais de SLA (ok / atenção / crítico / vencido)
- [x] SLA suprimido em chamados resolvidos
- [x] Dashboard de métricas com filtros e gráficos
- [x] Exportação CSV e PDF
- [x] Painel administrativo completo
- [x] Dark mode global
- [x] Editor rico TipTap (negrito, listas, imagens, links)
- [x] Assinaturas de e-mail por operador
- [x] Templates de resposta
- [x] Upload de anexos
- [x] Importação de clientes via CSV

---

## 15. Próximos Desenvolvimentos

### Alta Prioridade
- [ ] **Deploy em produção** — Vercel + Neon (PostgreSQL cloud) com domínio fixo
- [ ] **Notificações de SLA** — alerta por e-mail ao operador quando SLA está próximo de vencer
- [ ] **Busca full-text** — pesquisa por remetente, assunto e conteúdo das mensagens
- [ ] **Histórico do cliente** — tela listando todos os chamados associados a um e-mail/empresa
- [ ] **Armazenamento de anexos** — integrar com S3 ou Vercel Blob (atualmente apenas referenciado por URL)

### Média Prioridade
- [ ] **Notificações em tempo real** — Server-Sent Events ou WebSocket para atualizar o quadro sem refresh
- [ ] **Operações em lote** — selecionar múltiplos chamados para atribuir, resolver ou mover
- [ ] **Encaminhamento (forward)** — interface dedicada com troca total de destinatários
- [ ] **Visualização de histórico na conversa** — mostrar quem e quando moveu o chamado entre colunas
- [ ] **Foto do perfil do responsável** — exibir avatar real (via Microsoft) no cartão Kanban

### Baixa Prioridade / Futuro
- [ ] **Integração Microsoft Graph** — retornar ao plano original para suporte multi-conta corporativa
- [ ] **Auto-resposta por IA** — sugestão de resposta baseada no conteúdo do e-mail
- [ ] **WhatsApp / outros canais** — expandir para além do e-mail
- [ ] **App mobile** — versão responsiva aprimorada ou app nativo
- [ ] **Multi-tenant** — suporte a múltiplas empresas com isolamento de dados
- [ ] **Base de conhecimento** — artigos internos linkáveis nas respostas
- [ ] **Relatórios agendados** — envio automático de resumo semanal por e-mail

---

## 16. Variáveis de Ambiente (`.env`)

```env
# Banco de dados
DATABASE_URL="postgresql://usuario:senha@host:5432/atendimento"

# NextAuth
NEXTAUTH_SECRET="string_aleatória_segura"
NEXTAUTH_URL="https://url-do-sistema.com"

# Azure AD
AZURE_AD_CLIENT_ID="..."
AZURE_AD_CLIENT_SECRET="..."
AZURE_AD_TENANT_ID="..."

# Gmail
CAIXA_EMAIL_COMPARTILHADA="caixa@empresa.com"
GMAIL_USUARIO="conta@gmail.com"
GMAIL_SENHA_APP="senha_de_app_16_chars"

# Produção (opcional)
CRON_SECRET="segredo_para_proteger_endpoint_cron"
```
