# MarketGo

**Aplicativo de compras com entrega em React Native, Expo e Supabase: catálogo de lojas, carrinho, checkout e acompanhamento de pedidos, com as regras de dinheiro executadas no banco de dados.**

O MarketGo permite escolher uma loja, montar o carrinho, finalizar o pedido e acompanhar cada etapa até a entrega. O projeto combina desenvolvimento mobile, autenticação, banco de dados na nuvem com Row Level Security, funções SQL que controlam o ciclo do pedido e testes automatizados tanto do aplicativo quanto do banco.

## Identificação acadêmica

| Item | Informação |
| --- | --- |
| **Projeto** | Projeto 2 de 5 — MarketGo (portfólio profissional) |
| **Instituição** | IESB |
| **Disciplina** | Programação para Dispositivos Móveis |
| **Semestre** | 4º semestre |
| **Professor orientador** | Prof. Me. Bruno Assunção Dias |
| **Aluno desenvolvedor** | Hiarley de Morais Rabelo |
| **Material-base** | *MarketGo — Guia de construção passo a passo* (setembro de 2026), elaborado pelo Prof. Me. Bruno Assunção Dias |

> **Sobre esta documentação:** o MarketGo é desenvolvido no IESB, na disciplina de Programação para Dispositivos Móveis, pelo aluno Hiarley de Morais Rabelo, sob orientação do Prof. Me. Bruno Assunção Dias. A construção segue o documento *MarketGo — Guia de construção passo a passo*, fornecido pelo professor. Este README descreve o projeto conforme o guia; os resultados de testes e a validação do fluxo completo devem ser conferidos no repositório e no ambiente de execução.

## Pontos mais importantes do projeto

| Prioridade | Ponto central | Por que importa |
| --- | --- | --- |
| **Regra de ouro** | O app pede, o banco decide | Toda regra que envolve dinheiro fica no servidor; o app apenas apresenta o resultado. |
| **Total calculado no servidor** | A função `create_order` usa os preços da tabela `products` | Quem está no celular não consegue alterar o preço de um item antes de enviar o pedido. |
| **Sem escrita direta** | Não existem políticas de `insert`, `update` ou `delete` em `orders` e `order_items` | O app não consegue gravar pedidos por conta própria; só as funções escrevem. |
| **App sem preços** | `CreateOrderInput` envia apenas ids e quantidades | O cliente nunca informa valores monetários do pedido. |
| **Snapshot do pedido** | Nome da loja, nome e preço de cada item são copiados na compra | Mudanças futuras no catálogo não alteram pedidos antigos. |
| **Segurança de funções** | `security definer`, `set search_path` e `revoke`/`grant` | Funções só executam para usuários logados e conferem `auth.uid()`. |
| **Privacidade** | Row Level Security em todas as tabelas | Cada usuário lê apenas os próprios pedidos e itens. |
| **Concorrência** | `for update` ao mudar o status | Evita que dois toques simultâneos avancem o mesmo pedido duas vezes. |
| **Precisão financeira** | Soma em centavos inteiros no app | Evita erros de ponto flutuante como `0,1 + 0,2`. |
| **Testes do banco** | 13 testes com PGlite (Postgres real dentro do Node, sem Docker) | Regras de segurança escritas em SQL são testadas como qualquer código. |
| **Arquitetura em camadas** | Tela → hook → serviço → Supabase | Separa interface, acesso a dados e regras de negócio. |
| **Qualidade verificável** | 50 testes descritos no guia (37 do app e 13 do banco) | Devem ser executados no repositório. |

## Sumário

- [Identificação acadêmica](#identificação-acadêmica)
- [Visão geral e escopo](#visão-geral-e-escopo)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Como o pedido é criado](#como-o-pedido-é-criado)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Telas e navegação](#telas-e-navegação)
- [Modelo de dados](#modelo-de-dados)
- [Regras de negócio](#regras-de-negócio)
- [Como executar](#como-executar)
- [Segurança e privacidade](#segurança-e-privacidade)
- [Testes e validação](#testes-e-validação)
- [Gerar um APK de teste](#gerar-um-apk-de-teste)
- [Problemas comuns](#problemas-comuns)
- [Limitações e melhorias futuras](#limitações-e-melhorias-futuras)
- [Roteiro de desenvolvimento](#roteiro-de-desenvolvimento)
- [Apresentação no portfólio](#apresentação-no-portfólio)
- [Autoria e créditos](#autoria-e-créditos)

## Visão geral e escopo

O projeto tem três partes principais:

1. **Aplicativo:** cadastro, login, catálogo de lojas, carrinho persistente, checkout e acompanhamento de pedidos.
2. **Banco de dados com regras:** tabelas com restrições, Row Level Security e três funções SQL (`create_order`, `advance_order`, `cancel_order`) que controlam todo o ciclo do pedido.
3. **Testes:** funções puras do app testadas com Jest e o banco testado com PGlite, executando o mesmo `schema.sql` e `seed.sql` usados no Supabase.

O guia divide a construção em 15 etapas: as etapas 1 a 4 preparam ambiente, projeto, banco e testes do banco; as etapas 5 a 10 constroem as fundações, as regras testadas, a camada de dados, os componentes, os contextos e a navegação; as etapas 11 a 13 entregam o fluxo de compra (catálogo, carrinho, checkout e pedidos); a etapa 14 trata da qualidade e a etapa 15 orienta a publicação no GitHub e a apresentação.

**Contexto e finalidade:** o MarketGo é o Projeto 2 de 5 do portfólio profissional da disciplina. Tem finalidade educacional e de portfólio, voltado à prática de desenvolvimento mobile e de regras de negócio no banco.

> **O pagamento é simulado: nenhum valor é cobrado e nenhum pedido é entregue de verdade.** O status do pedido é avançado por um botão de demonstração; em um produto real, quem faz isso é a loja ou o entregador.

## Funcionalidades

### Conta e sessão

- Cadastro com nome, e-mail, senha e confirmação de senha.
- Login e logout com Supabase Auth.
- Persistência da sessão no aparelho usando AsyncStorage.
- Rotas protegidas: sem sessão, o usuário é enviado para `/login`; com sessão, as telas de autenticação redirecionam para o app.
- Cache de consultas limpo ao sair, para que dados de uma conta nunca apareçam em outra.

### Catálogo

- Lista de lojas com busca (sem diferença de acento ou maiúsculas) por nome, categoria ou descrição.
- Filtro por categoria: Mercado, Padaria, Farmácia, Hortifrúti e Restaurante.
- Lojas abertas primeiro e, dentro de cada grupo, melhor avaliação primeiro.
- Aviso de **loja fechada**: o cardápio pode ser visto, mas não é possível pedir.
- Cardápio agrupado por seção, com detalhe do produto e seletor de quantidade.
- Pull to refresh nas listas.

### Carrinho

- Carrinho **salvo no aparelho**, separado por usuário, que sobrevive ao fechar o app.
- Regra de **uma loja por vez**, com confirmação para esvaziar o carrinho ao trocar de loja.
- Limite de 20 unidades por produto, o mesmo limite do banco.
- Selo com a quantidade de itens na aba Carrinho e barra fixa com o resumo nas telas de loja.
- Aviso de quanto falta para atingir o **pedido mínimo**, com o botão de finalizar desabilitado.
- Validação do formato do carrinho lido do armazenamento: dados corrompidos ou de versões antigas são descartados.

### Checkout

- Endereço de entrega (rua, número, bairro e complemento opcional), preenchido com o endereço do último pedido.
- Formas de pagamento: Pix (simulado), cartão na entrega e dinheiro.
- Campo de troco apenas para dinheiro, validando que o valor cubra o total.
- Formulários com React Hook Form e validação tipada com Zod.
- Mensagens de erro do banco, já em português, exibidas ao usuário.

### Pedidos

- Histórico de pedidos com loja, data, estado e total.
- Linha do tempo (Recebido, Em preparo, Saiu para entrega, Entregue) que se **atualiza sozinha** a cada 5 segundos enquanto o pedido está em andamento.
- Cancelamento permitido apenas enquanto o pedido está "recebido".
- **Pedir novamente:** monta o carrinho com os preços e a disponibilidade atuais e avisa quais itens saíram do catálogo.
- Modo demonstração com o botão "Simular próximo passo".

> **O total exibido no checkout é uma prévia.** O valor oficial do pedido é o que a função `create_order` calcula no banco.

## Tecnologias

| Tecnologia | Responsabilidade |
| --- | --- |
| React Native e Expo | Aplicativo móvel para Android e iOS. |
| TypeScript | Tipagem do domínio, formulários e serviços. |
| Expo Router | Rotas baseadas em arquivos e navegação protegida. |
| Supabase Auth | Cadastro, login e validação de sessão. |
| PostgreSQL com RLS e funções SQL | Persistência, isolamento por usuário e regras de negócio dentro do banco. |
| TanStack Query | Consultas, mutações, cache e atualização automática dos pedidos. |
| React Hook Form e Zod | Formulários e validação tipada do checkout e da autenticação. |
| AsyncStorage | Persistência local da sessão e do carrinho. |
| `@expo/vector-icons` (Ionicons) | Ícones da interface. |
| Jest e jest-expo | Testes unitários das regras do app. |
| PGlite (`@electric-sql/pglite`) | Postgres real executado dentro do Node para testar o banco, sem Docker. |
| Prettier | Formatação do código. |

**Versões de referência declaradas no guia:** Expo SDK 57, React Native 0.86, React 19.2 e TypeScript 6. São as versões citadas no material, não uma verificação de compatibilidade realizada para este README. Ao trabalhar no repositório, confira `package.json` e o arquivo de lock.

## Arquitetura

A organização central é:

```text
Tela → Hook → Serviço → Supabase → PostgreSQL com RLS
                                      └→ Funções SQL (create_order, advance_order, cancel_order)
```

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| Rotas e telas | `app/` | Compor telas, navegação e interação. |
| Componentes | `src/components/` | Reutilizar elementos visuais. |
| Hooks | `src/hooks/` | Consultas e mutações com TanStack Query. |
| Serviços | `src/services/` | Concentrar acesso ao Supabase e chamadas RPC. |
| Regras puras | `src/utils/` | Carrinho, catálogo, pedidos, dinheiro, datas e erros. |
| Validação | `src/schemas/` | Schemas Zod de login, cadastro e checkout. |
| Estado global | `src/context/` | Sessão do usuário e carrinho. |
| Infraestrutura do app | `src/lib/` | Cliente Supabase e cliente do React Query. |
| Banco | `supabase/` | Esquema, RLS, funções, dados de exemplo e testes. |

**Regra de dependência:** as telas nunca importam o Supabase nem os serviços diretamente. As regras de negócio ficam em `src/utils/` (funções puras, sem tela, sem banco e sem rede) e em `supabase/schema.sql` (banco).

**Providers (ordem importa):** `QueryClientProvider` → `AuthProvider` → `CartProvider`. O carrinho fica dentro da sessão porque precisa saber quem é o usuário.

## Como o pedido é criado

| Passo | Quem faz | O que acontece |
| --- | --- | --- |
| 1 | App | Monta o carrinho e envia apenas ids e quantidades (nenhum preço). |
| 2 | Função `create_order` | Roda no banco. Confere se a loja está aberta e se cada produto existe, está ativo e é daquela loja. |
| 3 | Função `create_order` | Calcula o subtotal com os preços do banco, soma a entrega, confere o pedido mínimo e o troco. |
| 4 | Função `create_order` | Grava o pedido e copia nome e preço de cada item (snapshot). Devolve o id. |
| 5 | App | O usuário só lê os próprios pedidos. Não existe permissão de escrita direta. |

Se alguém adulterar o aplicativo, o banco recusa: o app nem envia preço, e a função valida login, loja aberta, pagamento, endereço, quantidades de 1 a 20 e ausência de itens repetidos.

## Estrutura de arquivos

Estrutura resumida do repositório:

```text
marketgo/
├── __tests__/                 # cart, catalog, checkout, money e orders (*.test.ts)
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (app)/
│       ├── _layout.tsx
│       ├── checkout.tsx
│       ├── order/[id].tsx
│       ├── product/[id].tsx
│       ├── store/[id].tsx
│       └── (tabs)/
│           ├── _layout.tsx
│           ├── index.tsx
│           ├── cart.tsx
│           ├── orders.tsx
│           └── profile.tsx
├── assets/
├── src/
│   ├── components/            # Button, Card, CartBar, CategoryChips, FormInput, Input,
│   │                          # OrderTimeline, ProductRow, QuantityStepper, Screen,
│   │                          # StateViews, StatusPill, StoreCard
│   ├── constants/catalog.ts
│   ├── context/               # AuthContext.tsx, CartContext.tsx
│   ├── hooks/                 # useAddToCart, useCatalog, useOrders, useReorder
│   ├── lib/                   # supabase.ts, queryClient.ts
│   ├── schemas/               # auth.ts, checkout.ts
│   ├── services/              # orders.ts, stores.ts
│   ├── theme/index.ts
│   ├── types/index.ts
│   └── utils/                 # cart, catalog, date, errors, icons, money, orders
├── supabase/
│   ├── schema.sql
│   ├── seed.sql
│   └── tests/db.test.mjs
├── .env.example
├── .gitignore
├── .prettierrc
├── AGENTS.md
├── App.tsx                    # resíduo do template; o ponto de entrada é expo-router/entry
├── CLAUDE.md
├── LICENSE
├── app.json
├── index.ts                   # resíduo do template
├── package.json
├── tsconfig.json
└── README.md
```

Arquivos locais e fora do Git: `.env`, `node_modules/` e `.expo/`.

## Telas e navegação

| Tela | Rota | Uso |
| --- | --- | --- |
| Login | `/login` | Entrar com e-mail e senha. |
| Cadastro | `/register` | Criar uma conta. |
| Lojas | `/` | Lista de lojas com busca e categorias. |
| Loja | `/store/[id]` | Cardápio por seção e barra do carrinho. |
| Produto | `/product/[id]` | Detalhe, quantidade e adicionar ao carrinho. |
| Carrinho | `/cart` | Itens, quantidades, totais e pedido mínimo. |
| Finalizar pedido | `/checkout` | Endereço, pagamento e confirmação. |
| Pedidos | `/orders` | Histórico de pedidos. |
| Acompanhar pedido | `/order/[id]` | Linha do tempo, itens, cancelar e pedir novamente. |
| Perfil | `/profile` | Dados da conta e sair. |

Os grupos `(auth)`, `(app)` e `(tabs)` organizam a navegação sem compor o endereço público das rotas. O layout de `(app)` é o guarda da área protegida; o de `(auth)` redireciona quem já está logado.

## Modelo de dados

### `stores`

Lojas do catálogo.

| Campo | Finalidade |
| --- | --- |
| `id` | Identificador (uuid). |
| `name`, `emoji`, `description` | Identificação e apresentação. |
| `category` | `Mercado`, `Padaria`, `Farmácia`, `Restaurante` ou `Hortifrúti`. |
| `rating` | Avaliação entre 0 e 5. |
| `delivery_fee` | Taxa de entrega (maior ou igual a zero). |
| `eta_min`, `eta_max` | Tempo estimado de entrega, em minutos. |
| `min_order` | Pedido mínimo. |
| `is_open` | Se a loja aceita pedidos agora. |

### `products`

Produtos de cada loja, com `store_id`, `section` (seção do cardápio), `name`, `description`, `price` (maior que zero), `emoji` e `is_active`.

### `orders`

Pedidos do usuário. Guarda `user_id` (padrão `auth.uid()`), `store_id`, **`store_name` (snapshot)**, `status`, `payment_method`, `change_for`, o endereço (`address_street`, `address_number`, `address_neighborhood`, `address_complement`), `subtotal`, `delivery_fee`, `total` e as datas `created_at` e `updated_at`.

- Status: `received`, `preparing`, `out_for_delivery`, `delivered` e `cancelled`.
- Pagamento: `pix`, `card` e `cash`.

### `order_items`

Itens de cada pedido: `order_id`, `product_id` (vira nulo se o produto for removido), **`name`, `emoji` e `unit_price` (snapshot)**, `quantity` (de 1 a 20) e `total_price`.

### Restrições essenciais

- `check` em preço maior que zero, quantidade de 1 a 20, status e forma de pagamento com valores válidos: o banco recusa dado inconsistente mesmo que o app tenha um erro.
- `order_items.order_id` e `orders.user_id` com `on delete cascade`.
- Índices por loja/seção/nome, por usuário/data e por pedido, para apoiar as consultas.
- RLS ligado nas quatro tabelas.

### Políticas e permissões

| Tabela | Leitura | Escrita direta |
| --- | --- | --- |
| `stores` | Usuários logados | Não existe. |
| `products` | Usuários logados, somente produtos ativos | Não existe. |
| `orders` | Somente o dono | **Não existe** (nenhuma política de insert, update ou delete). |
| `order_items` | Somente o dono do pedido | **Não existe.** |

### Funções (RPC)

| Função | Responsabilidade |
| --- | --- |
| `create_order` | Valida login, loja aberta, pagamento, endereço e itens; calcula subtotal, total e troco com os preços do banco; grava pedido e itens; devolve o id. |
| `advance_order` | Avança o status na ordem certa. Existe só para a demonstração. |
| `cancel_order` | Cancela apenas enquanto o pedido está "recebido". |

Todas rodam com `security definer` e `set search_path = public`, conferem o usuário com `auth.uid()`, têm `execute` revogado de `public` e liberado apenas para `authenticated`. Mensagens de erro já são em português.

### Dados de exemplo

O `seed.sql` cadastra **6 lojas** (uma delas fechada, para testar esse caso) e **50 produtos**: Mercado Bom Preço, Padaria Pão Quente, Farmácia Vida, Hortifrúti da Terra, Pizzaria Forno a Lenha e Sushi Sakura (fechada).

## Regras de negócio

### Carrinho

- O carrinho é de **uma loja por vez**: `addToCart` devolve `conflict: true` quando o produto é de outra loja e não altera o carrinho; a tela decide se esvazia.
- Limite de 20 unidades por produto, nos dois lados (app e banco).
- Totais calculados em **centavos inteiros**; a entrega só é cobrada se houver itens.
- `missingForMinimum` informa quanto falta para o pedido mínimo, ou `null` se já foi atingido.
- `isValidCart` confere o formato do carrinho lido do AsyncStorage antes de confiar nele.
- Um carrinho por usuário, com chave `marketgo.cart.<id>`; o carrinho só é salvo depois de carregado, para não apagar o conteúdo anterior.

### Checkout

- Rua com ao menos 3 caracteres, número de 1 a 10, bairro com ao menos 2 e complemento de até 60.
- O troco só é validado quando o pagamento é em dinheiro: precisa ser um valor válido e maior ou igual ao total.
- O campo de troco aceita formatos como `1.234,56`, `10,5` e `12.5`.
- O schema é criado por função (`makeCheckoutSchema(total)`), pois a regra do troco depende do total do carrinho.

### Pedidos

- A linha do tempo marca cada etapa como concluída, atual ou pendente; um pedido cancelado não avança nenhuma etapa.
- Enquanto o pedido está ativo (nem entregue nem cancelado), a tela consulta o servidor a cada 5 segundos.
- "Pedir novamente" usa preços e disponibilidade **atuais** e deixa de fora produtos que saíram do catálogo.
- O pedido guarda um snapshot: alterar o preço de um produto depois não muda pedidos antigos.

## Como executar

As instruções pressupõem que o código do projeto, construído conforme o guia, esteja disponível no repositório.

### 1. Pré-requisitos

- Node.js LTS na **versão 22 ou superior** (o teste do banco usa o executor de testes nativo do Node).
- npm e Git.
- Expo Go no celular, com computador e celular na mesma rede.
- Conta e projeto no Supabase.
- Conta Expo/EAS para o build opcional.

Confira o ambiente:

```bash
node -v
npm -v
git --version
```

### 2. Instalar dependências

Na raiz do projeto:

```bash
npm install
```

Se houver divergência entre dependências e o SDK do Expo:

```bash
npx expo install --fix
```

Se aparecer `ERESOLVE`, confira se `react-dom` está na mesma versão de `react`, ambas sem o acento circunflexo.

### 3. Configurar o banco

Crie um projeto no Supabase (por exemplo, região South America — São Paulo) e execute no SQL Editor, **nesta ordem**:

1. `supabase/schema.sql`: tabelas, RLS, permissões e funções `create_order`, `advance_order` e `cancel_order`.
2. `supabase/seed.sql`: 6 lojas e 50 produtos.

Confira em **Table Editor** que `stores` tem 6 linhas, `products` tem 50, `orders` e `order_items` estão vazias e todas têm RLS ativo. Em **Database → Functions** devem existir as três funções.

Se o app disser que não encontra a função depois de alterar o `schema.sql`, rode no SQL Editor:

```sql
notify pgrst, 'reload schema';
```

Para testar sem depender de e-mail, desative **Confirm email** em Authentication → Sign In / Providers → Email. Em um uso real, mantenha a confirmação ligada.

### 4. Configurar variáveis públicas

Copie `.env.example` para `.env` e preencha:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=SUA-CHAVE-ANON-OU-PUBLISHABLE
```

| Variável | Uso |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase. |
| `EXPO_PUBLIC_SUPABASE_KEY` | Chave pública anon ou publishable. |

> **Nunca coloque `service_role` nem a senha do banco no aplicativo.** Tudo que começa com `EXPO_PUBLIC_` é embutido no app durante o empacotamento.

Mantenha `.env` fora do Git e versione apenas `.env.example` com valores fictícios.

### 5. Iniciar o aplicativo

```bash
npx expo start
```

Abra no Expo Go. Se a rede bloquear a conexão entre celular e computador (comum em redes de faculdade), use:

```bash
npx expo start --tunnel
```

Após alterar o `.env`, reinicie limpando o cache:

```bash
npx expo start -c
```

### Scripts do projeto

| Comando | Ação |
| --- | --- |
| `npm start` | Inicia o Expo. |
| `npm run android` | Inicia o fluxo Android configurado no Expo. |
| `npm run ios` | Inicia o fluxo iOS configurado no Expo. |
| `npm test` | Executa os testes do app (Jest) e do banco (PGlite). |
| `npm run test:app` | Executa apenas os testes do app. |
| `npm run test:db` | Executa apenas os testes do banco. |
| `npm run typecheck` | Verifica os tipos com `tsc --noEmit`. |
| `npm run format` | Formata os arquivos com Prettier; altera arquivos. |

## Segurança e privacidade

- **O app não escreve pedidos:** não há política de `insert`, `update` ou `delete` em `orders` e `order_items`; toda escrita passa pelas funções.
- **Preços nunca vêm do app:** `CreateOrderInput` não possui campo de preço; o banco usa a tabela `products`.
- **Isolamento por usuário:** políticas RLS restringem pedidos e itens ao proprietário.
- **Funções fechadas por padrão:** `revoke ... from public` e `grant execute ... to authenticated`; o Postgres, por padrão, deixa qualquer um executar uma função.
- **`security definer` com cuidado:** as funções conferem `auth.uid()` e fixam o `search_path`.
- **Sem corrida entre toques:** `for update` bloqueia a linha do pedido durante a mudança de status.
- **Restrições no banco:** `check` em preço, quantidade, status e pagamento barram dados inconsistentes.
- **Segredos fora do app:** apenas a URL e a chave pública do Supabase ficam no `.env`; `.env` está no `.gitignore`.
- **Sem vazamento entre contas:** ao sair, o cache do React Query é limpo e o carrinho é guardado por usuário.
- **Dados de demonstração:** o pagamento é simulado e nenhum valor é cobrado.

Para conferir a segurança direto no banco, rode no SQL Editor:

```sql
select tablename, policyname, cmd
from pg_policies
where tablename in ('orders', 'order_items');
```

O resultado deve mostrar apenas linhas com `cmd` igual a `SELECT`. Chaves publicadas por engano devem ser regeneradas no painel do Supabase.

## Testes e validação

O guia informa **50 testes automatizados**, divididos em:

| Grupo | Quantidade informada | Cobertura descrita |
| --- | --- | --- |
| Aplicativo (Jest) | 37 em 5 suítes | Dinheiro, carrinho, catálogo, pedidos e validação do checkout. |
| Banco (PGlite) | 13 | Permissões, RLS, `create_order`, privacidade e ordem dos status. |
| **Total** | **50** | Regras puras do app e regras de segurança do banco. |

Execute no repositório:

```bash
npm run typecheck
npm test
npm run format
```

**Resultado esperado segundo o guia:** nenhum erro de tipos, `37 passed, 37 total` no Jest e `# pass 13`, `# fail 0` no teste do banco. Registre aqui o resultado da execução no seu ambiente quando disponível. Se o Prettier alterar arquivos, rode os testes novamente.

### O que o teste do banco cobre

O `supabase/tests/db.test.mjs` aplica o mesmo `schema.sql` e `seed.sql` do Supabase em um Postgres real rodando dentro do Node. Ele recria o schema `auth`, a função `auth.uid()` e os papéis `anon` e `authenticated`, e executa cada trecho como um usuário específico para testar o RLS de verdade. Cobre:

- leitura permitida (lojas e somente produtos ativos);
- escrita direta recusada;
- visitante (`anon`) sem permissão para executar funções;
- cálculo do total no servidor e snapshot de preço;
- pedido mínimo, loja fechada e itens inválidos (outra loja, inativo, quantidade fora da faixa e repetido);
- carrinho vazio, login, endereço, pagamento e troco;
- privacidade entre usuários;
- ordem dos status e cancelamento.

> **Os testes rodam sobre o arquivo `schema.sql` do disco, e não sobre o banco do Supabase.** Se o banco for alterado pelo painel sem atualizar o arquivo, os testes deixam de refletir a realidade. Toda mudança no banco deve entrar primeiro no arquivo.

### Roteiro de testes manuais

| # | Cenário | Resultado esperado |
| --- | --- | --- |
| 1 | Cadastro com senha de 3 caracteres | Mensagem "Use pelo menos 6 caracteres" |
| 2 | Cadastro válido e depois fechar e reabrir o app | Entra no app e continua logado |
| 3 | Buscar `padaria` e depois `PAO` | Encontra a Padaria Pão Quente nas duas buscas |
| 4 | Tocar em uma categoria e tocar de novo | Filtra e depois limpa o filtro |
| 5 | Abrir a Sushi Sakura e tocar em "+" | Aviso de loja fechada; nada entra no carrinho |
| 6 | Adicionar itens pelo "+" e pelo detalhe do produto | Selo e barra do carrinho atualizam; total correto |
| 7 | Fechar por completo e reabrir o app | O carrinho continua com os mesmos itens |
| 8 | Adicionar item de outra loja | "Trocar de loja?"; cancelar mantém, confirmar troca |
| 9 | Carrinho abaixo do pedido mínimo | "Faltam R$ ..." e botão Finalizar desabilitado |
| 10 | Confirmar o checkout vazio | Erros sob rua, número e bairro |
| 11 | Dinheiro com troco menor que o total | "O troco deve cobrir o total do pedido" |
| 12 | Confirmar um pedido válido | Abre o acompanhamento; o carrinho fica vazio |
| 13 | Comparar o total do app com `orders.total` no Supabase | Os valores são iguais |
| 14 | Simular os passos até "Entregue" | Linha do tempo avança; aparece "Pedir novamente" |
| 15 | Cancelar um pedido recém-recebido e tentar em um já em preparo | O primeiro cancela; no segundo o botão não existe |
| 16 | Novo checkout depois de um pedido | Endereço vem preenchido |
| 17 | Sair e entrar com outra conta | Sem pedidos e com carrinho vazio |
| 18 | Abrir a lista de lojas em modo avião | "Sem conexão com a internet." e botão Tentar novamente |

Os testes unitários não substituem esses cenários no aparelho nem a conferência das políticas no banco publicado.

## Gerar um APK de teste

Etapa opcional descrita no guia, utilizando EAS Build, para mostrar o app fora do Expo Go:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
```

As variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_KEY` precisam existir no ambiente do build (painel do EAS), pois o `.env` não vai para a nuvem. Nunca cadastre `service_role` nem a senha do banco ali. Antes do build, troque `seuusuario` em `bundleIdentifier` e `package` do `app.json` por um identificador próprio e único.

## Problemas comuns

| Sintoma | Verificação ou ação sugerida |
| --- | --- |
| QR Code não abre o app | Conferir o mesmo Wi-Fi ou usar `npx expo start --tunnel`. |
| "Variáveis do Supabase ausentes" | Criar o `.env` e reiniciar com `npx expo start -c`. |
| `ERESOLVE` no `npm install` | Igualar as versões de `react` e `react-dom`, sem `^`, e rodar `npm install` de novo. |
| Duas telas para `/` | Apagar o `app/index.tsx` temporário criado no teste de fumaça. |
| "Cannot find name 'describe'" | Conferir `"types": ["jest"]` no `tsconfig.json`. |
| "Confirme seu e-mail antes de entrar" | Desligar a confirmação de e-mail em Authentication. |
| Lojas e produtos não aparecem | Conferir `stores` e `products` no Table Editor e rodar o `seed.sql`. |
| `permission denied for table stores` | Rodar o trecho de `grant select` do `schema.sql`. |
| "Could not find the function ... in the schema cache" | Conferir os nomes `p_...` dos parâmetros e rodar `notify pgrst, 'reload schema';`. |
| "Faça login para fazer um pedido" | Sessão expirada ou ausente; sair e entrar de novo. |
| "Há itens inválidos no carrinho" | Item saiu do catálogo, ficou inativo ou é de outra loja; esvaziar o carrinho e montar de novo. |
| "O pedido mínimo desta loja é ..." | Subtotal abaixo do mínimo; adicionar mais itens. |
| `npm run test:db` falha com `Cannot find module` | Instalar com `npm install -D @electric-sql/pglite`. |
| `npm run test:db` não encontra os arquivos | Node antigo; usar o Node 22 ou superior. |
| Teste do banco passa, mas o app falha | O banco do Supabase difere do `schema.sql`; rodar o arquivo de novo no Supabase. |
| Carrinho vazio depois de reabrir o app | O carrinho é por usuário, ou o dado salvo era inválido e foi descartado. |
| Emojis aparecem como quadrados | A fonte do aparelho não tem o emoji; trocar por outro mais comum no `seed.sql`. |
| `git status` mostra o `.env` | Revisar o `.gitignore` antes de qualquer commit. |

## Limitações e melhorias futuras

### Limites da implementação descrita

- O pagamento é simulado: não há cobrança, provedor de pagamento nem webhook.
- O status do pedido é avançado por um botão de demonstração; não há painel da loja.
- O acompanhamento usa consulta periódica (a cada 5 segundos), não atualização em tempo real.
- Produtos e lojas usam emojis no lugar de fotos.
- O endereço é digitado a cada pedido (com preenchimento a partir do último), sem endereços salvos.
- Taxa de entrega e tempo estimado são fixos por loja, sem cálculo por distância.
- O horário de funcionamento é um campo simples (`is_open`), sem abertura e fechamento automáticos.
- O app não possui modo offline com fila de envio de pedidos.

### Evoluções propostas no material

- [ ] Atualização em tempo real com Supabase Realtime, no lugar da consulta a cada 5 segundos.
- [ ] Pagamento real com Mercado Pago ou Stripe: pedido "aguardando pagamento" e webhook em uma Edge Function.
- [ ] Fotos dos produtos no Supabase Storage.
- [ ] Endereços salvos (tabela própria com RLS).
- [ ] Cupons de desconto validados dentro de `create_order`.
- [ ] Horário de funcionamento: a loja abre e fecha sozinha.
- [ ] Avaliação do pedido (1 a 5 estrelas) após a entrega.
- [ ] Painel da loja: quem muda o status é o lojista.
- [ ] Notificações push quando o status muda.
- [ ] Taxa de entrega por distância e mapa.
- [ ] Testes de componentes com React Native Testing Library.
- [ ] GitHub Actions rodando `npm test` a cada commit.

Esses itens são propostas de evolução, não funcionalidades confirmadas da versão descrita.

## Roteiro de desenvolvimento

| Etapas do guia | Entrega |
| --- | --- |
| 1–2 | Ambiente e projeto Expo configurado (Router, TypeScript, Jest e Prettier). |
| 3–4 | Banco no Supabase com RLS e funções, e 13 testes do banco com PGlite. |
| 5–7 | Tipos, tema, utilitários, regras puras, 37 testes do app, serviços e hooks. |
| 8–10 | Componentes, contextos de sessão e carrinho, login, cadastro e abas. |
| 11–13 | Catálogo, carrinho, checkout, histórico e acompanhamento de pedidos. |
| 14–15 | Verificações, roteiro de 18 cenários, GitHub, README e apresentação. |

O apêndice docente do guia sugere cinco encontros e a seguinte distribuição de critérios de avaliação:

| Critério | Peso |
| --- | --- |
| Funcionalidade | 25% |
| Segurança e banco | 20% |
| Qualidade e testes | 20% |
| Interface e acessibilidade | 15% |
| Portfólio | 10% |
| Apresentação | 10% |

## Apresentação no portfólio

Os diferenciais técnicos a demonstrar são: regras de dinheiro no banco, total calculado no servidor, ausência de políticas de escrita em pedidos, snapshot de preço, RLS, testes do banco com PGlite, separação em camadas e cálculo em centavos.

Roteiro sugerido de 5 minutos:

| Tempo | O que mostrar | O que dizer |
| --- | --- | --- |
| 0:00 | Problema e tela de lojas | "Um app de compras com entrega, do catálogo ao acompanhamento." |
| 1:00 | Carrinho e troca de loja | "O carrinho é de uma loja por vez e fica salvo no aparelho." |
| 2:00 | Checkout e pedido | "O app só envia ids e quantidades. O total é calculado no banco." |
| 3:00 | Tabela de políticas e testes | "Nenhuma política de escrita em pedidos. 50 testes, incluindo o banco." |
| 4:00 | Código da função `create_order` | "Aqui ficam as regras. Se o app for adulterado, o banco recusa." |

Perguntas que podem aparecer:

- **E se alguém alterar o preço no celular?** O app nem envia preço. O banco usa os preços da tabela.
- **Por que não gravar o pedido direto no banco?** Porque o cliente não é confiável. A função valida tudo e garante que pedido e itens sejam gravados juntos.
- **Como você testou o banco?** Com PGlite: Postgres de verdade, com o mesmo schema, trocando de usuário para testar o RLS.
- **E o pagamento de verdade?** Precisa de um provedor (Mercado Pago, Stripe) e de um webhook em uma função de servidor, previsto nas evoluções.

Para apresentar a implementação, prepare:

- Capturas reais das telas de lojas, carrinho, checkout e acompanhamento, em uma pasta `docs/`.
- Resultado dos testes executados no repositório.
- Instruções de configuração reproduzíveis e arquivos SQL versionados.
- Contatos do autor (GitHub e LinkedIn).

Não há imagens ou links de demonstração inventados neste README. Acrescente esses elementos quando estiverem disponíveis.

## Autoria e créditos

**Desenvolvimento:** Hiarley de Morais Rabelo, aluno do 4º semestre, no IESB.

**Orientação:** Prof. Me. Bruno Assunção Dias, na disciplina de Programação para Dispositivos Móveis.

**Material-base:** este projeto é construído a partir do documento **MarketGo — Guia de construção passo a passo**, edição de **setembro de 2026**, de autoria do **Prof. Me. Bruno Assunção Dias**, IESB, identificado no guia como projeto 2 de 5 de um portfólio profissional. O guia é o material didático de referência; a implementação deste repositório é desenvolvida pelo aluno.

Referências dentro do guia:

- Antes de começar: escopo, decisão de arquitetura e tecnologias.
- Etapas 1–4: ambiente, projeto, banco no Supabase e testes do banco.
- Etapas 5–10: fundações, regras de negócio, camada de dados, componentes, contextos e navegação.
- Etapas 11–13: catálogo, carrinho, checkout e pedidos.
- Etapas 14–15: qualidade, portfólio e apresentação.
- Apêndices A–D: árvore de arquivos, solução de problemas, desafios de evolução, cronograma e avaliação.

**Licença:** consulte o arquivo [`LICENSE`](LICENSE) na raiz do repositório.

## Autor

Hiarley de Morais Rabelo · [LinkedIn](https://www.linkedin.com/in/hiarley-morais-bbb360352) · [GitHub](https://github.com/Hiarley007)