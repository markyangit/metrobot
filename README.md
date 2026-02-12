# Metrobot

Bot do Telegram para consultar horários do Metrofor (Sistema de Transporte Metroviário de Fortaleza - Linha Sul).

## Sobre o Projeto

O Metrobot é um bot para Telegram que facilita a consulta de horários do metrô de Fortaleza. Ele faz scraping da API pública do Metrofor e apresenta as informações de forma amigável através do Telegram.

### Funcionalidades

- Consulta de horários em tempo real
- Seleção interativa de estações de origem e destino
- Informações detalhadas sobre a viagem:
  - Horário de saída estimado
  - Horário de chegada estimado
  - Tempo estimado da viagem
  - Número de estações entre origem e destino
  - Próximos horários disponíveis
- Cache inteligente para otimizar requisições (TTL de 1 hora)

## Stack Técnica

- **Runtime**: [Bun](https://bun.sh) - Runtime JavaScript/TypeScript rápido
- **Linguagem**: TypeScript
- **Bot Framework**: [grammY](https://grammy.dev) - Framework moderno para bots do Telegram
- **HTML Parser**: [cheerio](https://cheerio.js.org) - Parser HTML rápido e leve
- **Lint/Format**: [Biome](https://biomejs.dev) - Linter e formatador all-in-one

## Pré-requisitos

- [Bun](https://bun.sh) instalado (versão 1.0 ou superior)
- Token de bot do Telegram (veja seção "Configuração do Bot")

## Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd metrobot
```

2. Instale as dependências:
```bash
bun install
```

3. Configure o token do bot (veja próxima seção)

## Configuração do Bot

### Criando um bot no Telegram

1. Abra o Telegram e procure por [@BotFather](https://t.me/botfather)
2. Envie o comando `/newbot`
3. Siga as instruções para escolher um nome e username para seu bot
4. O BotFather fornecerá um **token** (ex: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Guarde esse token com segurança

### Configurando variáveis de ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e adicione seu token:
```bash
TELEGRAM_BOT_TOKEN=seu_token_aqui
```

**⚠️ IMPORTANTE:**
- Nunca commite o arquivo `.env` no Git (já está no `.gitignore`)
- O arquivo `.env.example` serve como template e deve ser commitado
- Para deploy (Railway, Fly.io, etc), configure as variáveis de ambiente na plataforma

## Executando o Bot

### Modo desenvolvimento (com hot reload):
```bash
bun run dev
```

### Modo produção:
```bash
bun start
```

## Estrutura do Projeto

```
metrobot/
├── src/
│   ├── bot/
│   │   └── index.ts          # Lógica do bot Telegram
│   ├── scraper/
│   │   ├── cache.ts           # Sistema de cache em memória
│   │   ├── metrofor.ts        # Funções de scraping da API
│   │   └── parser.ts          # Parse HTML com cheerio
│   ├── types/
│   │   └── index.ts           # Tipos TypeScript
│   └── index.ts               # Entry point
├── tests/
│   └── parser.test.ts         # Testes (TODO)
├── package.json
├── tsconfig.json
├── biome.json
└── README.md
```

## Como Usar o Bot

1. Abra o Telegram e procure pelo seu bot (usando o username que você criou)
2. Envie `/start` para ver a mensagem de boas-vindas
3. Envie `/horario` para iniciar uma consulta
4. Selecione a estação de origem
5. Selecione a estação de destino
6. Escolha "Agora" para ver horários atuais
7. O bot retornará as informações da viagem

## Comandos Disponíveis

- `/start` - Mensagem de boas-vindas
- `/horario` - Iniciar consulta de horários

## Scripts Disponíveis

```bash
bun run dev        # Executar em modo desenvolvimento com watch
bun start          # Executar em modo produção
bun run lint       # Verificar código com Biome
bun run lint:fix   # Corrigir problemas automaticamente
bun run format     # Formatar código
bun test           # Executar testes (TODO)
```

## Fluxo da API do Metrofor

O bot interage com a API pública do Metrofor da seguinte forma:

1. **GET** `https://info.metrofor.ce.gov.br/`
   - Extrai o CSRF token do formulário

2. **POST** `https://info.metrofor.ce.gov.br/horarios`
   - Parâmetros: `csrfmiddlewaretoken`, `pk=1`, `estacao_origem=0`, `estacao_destino=0`
   - Retorna HTML com lista de estações disponíveis

3. **POST** `https://info.metrofor.ce.gov.br/horarios`
   - Parâmetros: `csrfmiddlewaretoken`, `pk=1`, `estacao_origem=[ID]`, `estacao_destino=[ID]`, `dt_viagem` (opcional)
   - Retorna HTML com informações de horários

## Sistema de Cache

O bot utiliza um sistema de cache em memória para otimizar as requisições:

- **TTL**: 1 hora
- **Dados cacheados**: CSRF token e lista de estações
- **Benefícios**: Reduz latência e carga no servidor do Metrofor

## Limitações Atuais

- Apenas Linha Sul está implementada (hardcoded `pk=1`)
- Seleção de data/hora customizada ainda não implementada (apenas "Agora")
- Sem persistência de dados (cache apenas em memória)
- Sem variáveis de ambiente (configurações hardcoded)

## Próximos Passos

- [ ] Implementar seleção de data/hora customizada
- [ ] Adicionar suporte para outras linhas (Oeste, Nordeste, VLT)
- [ ] Adicionar testes automatizados
- [ ] Implementar variáveis de ambiente
- [ ] Adicionar Docker para deployment
- [ ] Implementar persistência de cache (Redis/SQLite)

## Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## Licença

Este projeto é de código aberto para fins educacionais.

---

**Nota**: Este bot não é oficial e não possui relação com a Metrofor. É um projeto independente que utiliza a API pública do site do Metrofor.
