# Especificação Técnica — @t8ngs/core

## Visão Geral

@t8ngs/core é o núcleo de um framework de testes leve, orientado a eventos e escrito em TypeScript, inspirado no t8ngs/core. Ele fornece os blocos fundamentais para a criação de runners de teste e frameworks de teste customizados, com foco em extensibilidade, performance e tipagem forte.

---

## Objetivos do Projeto
- Fornecer uma base robusta e extensível para frameworks de teste.
- Ser TypeScript-first, garantindo tipagem e IntelliSense.
- Suportar ESM e CommonJS.
- Permitir filtragem flexível de testes (por tags, títulos, etc).
- Oferecer um sistema de eventos para construção de plugins e repórteres.
- Manter dependências mínimas e alta performance.

---

## Estrutura de Pastas

- `src/` — Código-fonte principal
  - `debug.ts` — Utilitário de debug
  - `emitter.ts` — Event Emitter customizado
  - `interpolate.ts` — Utilitário para interpolação de strings
  - `refiner.ts` — Lógica de filtragem/refino de testes
  - `runner.ts` — Runner de testes principal
  - `summary_builder.ts` — Builder para sumarização dos resultados
  - `test_context.ts` — Contexto compartilhado entre os testes
  - `tracker.ts` — Rastreamento de eventos e geração de sumário
  - `types.ts` — Tipos globais do framework
  - `group/`, `suite/`, `test/` — Implementações de agrupamento, suíte e teste

- `tests/` — Testes automatizados
  - Estrutura espelhando a de `src/` para granularidade dos testes
  - Testes unitários para cada componente

- `tests_helpers/` — Utilitários auxiliares para testes

- Arquivos de configuração: `tsconfig.json`, `eslint.config.js`, `commitlint.config.js`, etc.

---

## Componentes Principais

### 1. Runner
- Responsável por executar os testes, emitir eventos e gerar o sumário final.
- Permite filtragem de testes via opções.
- Usa o `Emitter` para notificar eventos do ciclo de vida dos testes.

### 2. Emitter
- Implementa um sistema de eventos customizado para o ciclo de vida dos testes.
- Permite adicionar/remover listeners e emitir eventos tipados.

### 3. Tracker
- Observa os eventos do runner para construir um sumário detalhado da execução.
- Mantém árvore de falhas, títulos de testes falhados e agregados (total, passed, failed, etc).
- Permite extração de um relatório detalhado via `getSummary()`.

### 4. Refiner
- Permite filtrar quais testes, grupos ou suítes devem ser executados, com base em tags, nomes, etc.
- Suporta lógica de pinning e negação de tags.

### 5. SummaryBuilder
- Permite registro de múltiplos repórteres de sumário.
- Constrói uma tabela de sumário customizada a partir dos repórteres registrados.

### 6. TestContext
- Fornece um contexto isolado e extensível para cada teste.
- Baseado em Macroable para permitir extensão dinâmica.

### 7. Group, Suite, Test
- Estruturas para organização hierárquica dos testes.
- Permitem hooks, agrupamento e execução isolada.

---

## Fluxo de Execução
1. O Runner é instanciado e recebe os testes a serem executados.
2. O Refiner pode ser usado para filtrar quais testes/grupos/suítes serão executados.
3. O Runner executa os testes, emitindo eventos para cada etapa (início/fim de runner, suíte, grupo, teste, etc).
4. O Tracker escuta esses eventos e constrói o sumário de execução, incluindo falhas e estatísticas.
5. O SummaryBuilder pode ser usado para gerar um sumário customizado dos resultados.

---

## Tipos e Contratos
- Tipos fortemente definidos em `types.ts` para todos os eventos, nós de árvore, payloads de hooks, etc.
- Suporte a hooks de setup, teardown e cleanup para testes e grupos.
- Contratos para repórteres de sumário.

---

## Testes Automatizados
- Testes unitários para todos os componentes principais, cobrindo cenários de sucesso, falha, hooks, filtragem, etc.
- Utilização de helpers para simular eventos e aguardar execuções assíncronas.

---

## Convenções e Configuração
- Projeto segue padrões de lint, commit e formatação via ESLint, Prettier e Commitlint.
- Suporte a geração de declarações TypeScript (`.d.ts`) para consumo externo.
- Estrutura de exportação compatível com ESM e CommonJS.

---

## Licença
MIT © t8ngs
