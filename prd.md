# PRD — Sistema Interno de Atendimento via E-mail

**Versão:** 1.0  
**Data:** 01/05/2026  
**Status:** Em estruturação

---

## 1. Visão Geral

Sistema interno de atendimento baseado em e-mail com interface Kanban, integrado ao Microsoft 365. O objetivo é centralizar o recebimento, acompanhamento e resolução de demandas enviadas por e-mail, com controle de SLA, métricas de atendimento e gestão de operadores.

---

## 2. Objetivos

- Substituir o acompanhamento manual de e-mails no Outlook por uma interface estruturada de atendimento
- Garantir visibilidade total do fluxo de comunicação por chamado (thread completa)
- Controlar prazos de atendimento (SLA) por prioridade
- Permitir métricas de desempenho por operador, equipe e tipo de demanda
- Suportar envio e recebimento de e-mails ricos (imagens, anexos, formatação)

---

## 3. Perfis de Usuário

### ADM (Administrador)
- Cria e gerencia usuários (aprova acesso via SSO)
- Cria e configura categorias, prioridades, colunas do Kanban
- Define regras de atribuição de categorias por operador
- Reatribui chamados entre operadores
- Acessa todos os dashboards e painel de SLA vencido
- Cria templates de resposta e configurações globais

### HC (Operador de Atendimento)
- Foco exclusivo no atendimento das demandas
- Visualiza chamados atribuídos a si ou todos (configurável)
- Responde, encaminha e compõe e-mails
- Configura suas próprias assinaturas de e-mail
- Acompanha seu painel de chamados ao fazer login

---

## 4. Autenticação

- Login via **SSO Microsoft 365** (Azure AD / MSAL)
- Após o primeiro login, conta fica com status `pendente`
- ADM aprova o acesso antes que o usuário possa operar
- Sem autenticação local — exclusivamente via conta Microsoft corporativa

---

## 5. Integração com Microsoft 365

- Leitura e envio via **Microsoft Graph API**
- Caixa de e-mail compartilhada do setor (ex: `atendimento@empresa.com`)
- E-mails enviados saem com identidade do setor, não do operador individual
- Sincronização via **polling a cada 1 minuto**
- Suporte a anexos, imagens inline e e-mails em HTML

---

## 6. Chamados (Tickets)

### Criação
- **Automática:** novo e-mail recebido na caixa compartilhada gera chamado automaticamente
- **Manual:** operador abre novo chamado e define destinatários (TO, CC, BCC)

### Identificação de Thread
- Chamados são agrupados pelo `threadId` do Microsoft Graph
- Todas as respostas do mesmo thread ficam no mesmo chamado
- Ordem cronológica de recebimento, visual similar ao Outlook

### Responsável
- Cada chamado tem um responsável único (HC)
- Outro operador pode pesquisar e assumir o chamado
- Reatribuição também disponível para ADMs

### Campos do Chamado
- Assunto
- Categoria
- Prioridade (com SLA associado)
- Coluna Kanban atual
- Responsável
- Data de criação
- Prazo SLA
- Origem (recebido / iniciado pelo operador)

---

## 7. Clientes e Participantes

### Clientes
- Identificados pelo e-mail do remetente
- Criados automaticamente no primeiro contato
- Em chamados manuais, todos os destinatários TO são registrados como clientes
- Cadastro pode ser enriquecido: nome, empresa, CNPJ, e-mail, telefone, Rede

### Participantes do Chamado
- Cada mensagem registra TO, CC e BCC individualmente
- Participantes podem ser adicionados ou removidos a qualquer momento durante o atendimento
- Suporte a encaminhamento (forward) com alteração de destinatários

### Pesquisa de Histórico
- Busca por e-mail do cliente exibe todos os chamados associados
- Visão estilo Outlook: por remetente, assunto, data, conteúdo

---

## 8. Kanban

### Colunas Padrão (configuráveis)
1. Novo
2. Atribuído
3. Em Atendimento
4. Aguardando Cliente
5. Resolvido

### Configuração
- ADM pode criar, renomear e reordenar colunas
- Cada coluna tem cor configurável
- Uma coluna pode ser marcada como "estado resolvido"

### Automações
- E-mail recebido em chamado com status "Aguardando Cliente" → volta para coluna anterior automaticamente
- Movimentação manual entre colunas por drag & drop

### Filtros
- Operador pode alternar entre "meus chamados" e "todos os chamados"
- ADM vê todos por padrão

---

## 9. Categorias e Prioridades

### Categorias
- Criadas e gerenciadas pelo ADM
- Cada categoria pode ser atribuída a: todos os operadores, ou operadores específicos
- Chamados recebidos são classificados manualmente ou por regra futura

### Prioridades
- Criadas pelo ADM com nome, cor e SLA em horas úteis
- SLA padrão: 1 dia útil (8 horas úteis)
- Prioridade definida manualmente pelo ADM ou operador

---

## 10. SLA

- Calculado em horas úteis a partir da criação do chamado
- Base: prioridade do chamado
- Quando o prazo vence:
  - **Operador:** alerta visual no card do chamado
  - **ADM:** painel dedicado listando todos os chamados com SLA vencido
- Verificação automática a cada 5 minutos

---

## 11. Composição de E-mails

### Editor Rico (TipTap)
- Negrito, itálico, sublinhado
- Listas ordenadas e não ordenadas
- Imagens inline (coladas ou carregadas)
- Links clicáveis
- Upload de anexos
- Seleção de fonte e tamanho
- Hiperlinks

### Assinaturas
- Cada operador configura suas próprias assinaturas
- Múltiplas assinaturas salvas por operador
- Seleção da assinatura no momento da composição
- Uma assinatura pode ser marcada como padrão

### Templates de Resposta
- Criados pelo ADM
- Disponíveis para seleção pelo operador na composição
- Preenchem assunto e corpo automaticamente

### Destinatários Dinâmicos
- TO, CC e BCC editáveis a qualquer momento no thread
- Suporte a encaminhamento com troca total de destinatários

---

## 12. Métricas e Exportação

### Dashboards (ADM)
- Chamados abertos, em andamento e resolvidos (por período)
- Tempo médio de primeira resposta
- Tempo médio de resolução
- Volume por operador
- Volume por categoria
- Volume por prioridade
- Chamados com SLA vencido (painel dedicado)

### Exportação
- Exportação simples em Excel e/ou PDF
- Filtros por período, operador, categoria e prioridade

---

## 13. Arquitetura Técnica

### Stack

| Camada | Tecnologia |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Banco de dados | PostgreSQL |
| ORM | Prisma |
| Autenticação | NextAuth.js + Azure AD |
| Integração e-mail | Microsoft Graph API |
| Editor rico | TipTap |
| UI / Componentes | Tailwind CSS + shadcn/ui |
| Deploy | Docker Compose (VM) |

### Modelo de Dados (resumo)

```
usuario             → id, nome, email, cargo, status, microsoftId
cliente             → id, email, nome, empresa, cnpj
assinatura_email    → id, usuarioId, nome, conteudoHtml, padrao
template_email      → id, nome, assunto, conteudoHtml, criadoPor

chamado             → id, assunto, responsavelId, colunaId, prioridadeId,
                       categoriaId, threadId, prazoSla, origem, criadoEm

participante_chamado → id, chamadoId, clienteId, tipo (para/cc/cco),
                        adicionadoEm, adicionadoPor, removidoEm

mensagem_email      → id, chamadoId, deEmail, deNome, conteudoHtml,
                       direcao (entrada/saida), encaminhamento, enviadoEm

destinatario_mensagem → id, mensagemId, email, nome, tipo (para/cc/cco)
anexo_mensagem      → id, mensagemId, nomeArquivo, tamanho, mimeType, urlArmazenamento

coluna_kanban       → id, nome, ordem, cor, padrao, resolvido
categoria           → id, nome, descricao
atribuicao_categoria → id, categoriaId, usuarioId (nulo = todos)
prioridade          → id, nome, horasSla, cor
```

---

## 14. Plano de Desenvolvimento (Fases)

| Fase | Escopo |
|---|---|
| 1 — Base | Next.js + PostgreSQL + Docker Compose + Prisma schema completo |
| 2 — Autenticação | SSO Microsoft + fluxo de aprovação ADM + gestão de usuários |
| 3 — Integração Graph API | Polling + leitura de e-mails + criação automática de chamados e clientes |
| 4 — Kanban | Colunas configuráveis, cards, drag & drop, filtros meus/todos |
| 5 — Composição | Editor TipTap, assinaturas, templates, anexos, TO/CC/BCC dinâmico |
| 6 — Configurações ADM | Categorias, prioridades, SLA, colunas, atribuição por operador |
| 7 — Métricas | Dashboards, painel SLA, exportação Excel/PDF |
| 8 — Busca | Pesquisa estilo Outlook por cliente, assunto, data, conteúdo |

---

## 15. Fora do Escopo (v1)

- Integração com outros canais (WhatsApp, chat, telefonia)
- Base de conhecimento / FAQ interno
- Automação de respostas por IA
- App mobile
- Integração com CRM externo
- Multi-tenant (múltiplas empresas)
