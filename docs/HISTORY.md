# Histórico do Projeto Email Timeline

Este documento resume o desenvolvimento e as decisões tomadas até o dia 20/01/2026.

## Objetivos
Criar uma aplicação para visualizar emails em uma linha do tempo, agrupados por "Subject" (Assunto/Obra), permitindo acompanhar o progresso de cada tarefa.

## O Que Foi Feito

### 1. Estrutura do Projeto
- **Backend (Node.js/Express)**:
  - Servidor criado em `server/`.
  - Conexão com email via IMAP (configurado em `src/config/imapConfig.js` e `src/services/emailService.js`).
  - Lógica para agrupar emails por TAGs (ex: `#Elevador`).
  - Banco de dados simulado com arquivos JSON (`companyMap.json`, `subjectMap.json`) para facilitar o desenvolvimento sem banco real por enquanto.
  
- **Frontend (React + Vite)**:
  - Aplicação criada em `client/`.
  - Estilização com **TailwindCSS**.
  - Tela de Login e Tela Principal (Dashboard).
  - Componentes para visualizar a timeline de emails.

### 2. Funcionalidades Implementadas
- **Login**: Autenticação básica (simulada ou via email real).
- **Leitura de Emails**: O sistema varre a caixa de entrada (ou usa dados mockados) procurando palavras-chave.
- **Definição de Responsáveis**:
  - Implementada lógica para definir quem é o responsável por cada Grupo ou Empresa.
  - Filtro para aceitar apenas emails `@sbsempreendimentos.com.br`.

### 3. Migração e Deploy
- **Google Cloud**:
  - Preparado arquivo `Dockerfile` e scripts para deploy no Google Cloud Run.
  - Criado guia `deployment_guide.md` (no histórico anterior).
- **Git/GitHub**:
  - Projeto versionado com Git.
  - Repositório remoto configurado em: `https://github.com/AlexandreFuscoPin/TimeLine`.

## Como Continuar no Novo PC

1. **Instalar Ferramentas**:
   - Git
   - Node.js (versão 20 ou superior)
   - VS Code

2. **Baixar o Projeto**:
   ```bash
   git clone https://github.com/AlexandreFuscoPin/TimeLine.git
   ```

3. **Rodar o Projeto**:
   - Instalar dependências: `npm install` (nas pastas client e server).
   - Iniciar Server: `cd server && npm run dev`.
   - Iniciar Client: `cd client && npm run dev`.

## Próximos Passos (Planejado)
- [ ] Testar conexão IMAP real no ambiente de produção.
- [ ] Finalizar configuração do Banco de Dados (Cloud SQL) se for para produção.
- [ ] Refinar a interface da Timeline conforme feedback de uso.
