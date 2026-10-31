# Arquitetura: avaliação e decisão

Este documento compara duas formas de montar o site a partir dos dados do cliente e registra a decisão.

## Requisitos considerados

- Custo operacional de R$ 0.
- Sem APIs, serviços pagos ou bibliotecas externas.
- Publicação gratuita no GitHub Pages.
- SEO, acessibilidade e responsividade preservados.
- Simples de entender e de personalizar.

## Opção 1: renderização no navegador (JavaScript)

O HTML tem contêineres vazios, e um script monta as seções a partir de `site.json` quando a página carrega.

**Vantagens**
- Não exige nenhuma etapa de build. Basta editar os dados e publicar.
- Uma única fonte de verdade, lida no navegador.

**Desvantagens**
- Sem JavaScript, o conteúdo some. Uma verificação automatizada ou um mecanismo de busca que não execute o script vê uma página quase vazia.
- SEO mais frágil: título, descrição e textos dependem da execução do script.
- Dados sensíveis a erro de execução: um campo inválido quebra a página sem aviso prévio.
- O script precisa de cuidado para não inserir HTML vindo dos dados.

## Opção 2: geração de HTML estático com Node.js nativo

Um script (`build.js`) lê `site.json`, valida os dados, e grava um `index.html` completo em `docs/`. Só a pasta `docs/` é publicada.

**Vantagens**
- A página inteira existe no HTML: SEO, compartilhamento e leitura sem JavaScript funcionam.
- Nenhuma dependência: Node.js já vem instalado (versão 26 neste ambiente), e os testes usam o módulo `node:test` embutido.
- Erros de dados aparecem no momento da geração, não para o visitante.
- Compatível com GitHub Pages (pasta `docs/` como fonte).

**Desvantagens**
- Para regerar o site após uma mudança, é preciso rodar `node build.js` no computador.
- Quem não usa terminal depende de alguém para gerar o site, ou de uma automação futura (por exemplo, GitHub Actions, que é gratuita para repositórios públicos, mas não está implementada aqui).

## Decisão

**Opção 2 (geração estática com Node.js nativo).**

Justificativa: a exigência de SEO, de acesso sem JavaScript e de confiabilidade pesa mais que a simplicidade de editar sem build. O custo extra é um comando de geração, que é simples de documentar. Não é preciso nenhum framework.

Regras para manter a simplicidade:
- Um único arquivo de dados por cliente (`site.json`).
- Um único gerador (`build.js`), sem dependências.
- Nenhum motor de templates: o HTML é montado com funções JavaScript e todo texto passa por escape.
- Um único arquivo de script no navegador (`js/menu.js`), só para menu móvel e aviso de demonstração.

## Riscos aceitos

- Alterações no site exigem regeração. Mitigação: documentação em `COMO-USAR.md`.
- O gerador precisa ser mantido junto com o modelo. Mitigação: testes em `tests/`.
- Se o cliente quiser editar sem terminal, a solução futura é uma automação de build no GitHub (fora do escopo atual).
