# Como criar um site para um novo cliente

Este modelo gera um site estático (HTML, CSS, JavaScript mínimo e imagens) a partir de um único arquivo de dados, `site.json`. O resultado fica na pasta `docs/`, pronta para publicação gratuita no GitHub Pages.

## Pré-requisitos

- Node.js instalado. Testado somente com a versão 26. Versões anteriores não foram verificadas. Não é preciso instalar nenhum pacote.
- Um navegador para conferir o resultado.
- Conta gratuita no GitHub, somente na hora de publicar.

## Passo a passo

### 1. Copiar o modelo

Copie a pasta `modelo-site-negocio` e renomeie-a com o nome do cliente, por exemplo `restaurante-sabor-da-casa`. Use letras minúsculas e hifens, sem espaços.

### 2. Preencher `site.json`

Este é o único arquivo que você precisa editar para o conteúdo. Ele é um JSON: textos entre aspas, vírgulas entre itens e nenhum comentário.

| Campo | O que colocar |
|---|---|
| `modoDemonstracao` | `false` para um cliente real. Com `true`, o site mostra avisos de demonstração. |
| `negocio.nome`, `marca`, `inicial` | Nome completo, nome curto no cabeçalho e a letra do logo. |
| `negocio.titulo`, `descricao` | Título da aba do navegador e descrição para mecanismos de busca (até cerca de 160 caracteres). |
| `negocio.urlCanonica` | Opcional. Endereço final do site em `https://`, usado como canonical para SEO. Preencha depois de publicar; deixe `""` antes disso. |
| `negocio.favicon` | Opcional. Ícone da aba do navegador, como `imagens/logo.png` (`.svg`, `.png` ou `.ico`). Deixe `""` para usar o `favicon.svg` padrão (um "N" dourado). |
| `compartilhamento.titulo`, `descricao` | Opcionais. Título e descrição exibidos ao compartilhar o link. Se vazios, usam `negocio.titulo` e `negocio.descricao`. |
| `compartilhamento.url` | Opcional. Endereço base do site em `https://`, terminado em `/`. Se vazio, usa `negocio.urlCanonica`. |
| `compartilhamento.imagem`, `imagemAlt` | Opcionais. Imagem de pré-visualização, como `imagens/capa.jpg` (`.jpg`, `.png` ou `.webp`; SVG não é aceito). Com imagem, `imagemAlt` é obrigatório e a URL base precisa estar preenchida. |
| `negocio.endereco`, `horarios` | Endereço e uma linha por horário. |
| `tema` | Cores em hexadecimal, como `#d4a84b`. Veja a seção "Cores" abaixo. |
| `canais.telefone`, `email` | Opcionais. Deixe `""` se não houver. |
| `canais.whatsapp` | Número com DDI e DDD, somente dígitos, como `5511900000000`. Deixe `""` se não houver. |
| `canais.redes` | Lista de `{ "nome": "...", "url": "https://..." }`. Deixe `[]` se não houver. |
| `hero` | Frase de destaque e textos dos dois botões. |
| `secoes.<nome>.ativa` | `true` para mostrar a seção, `false` para ocultar. |
| `secoes.*` | Títulos, textos, itens de serviço, preços, galeria e mapa. |

Seções disponíveis: `sobre`, `servicos`, `precos`, `galeria`, `localizacao`, `contato`.

Cada seção ativa precisa de `rotulo` (nome no menu) e `titulo`. As demais exigências aparecem na mensagem de erro se algo faltar.

### 3. Colocar as imagens

Coloque os arquivos na pasta `imagens/`, por exemplo `imagens/cliente-1.jpg`. Em `site.json`, escreva o caminho completo, como `"arquivo": "imagens/cliente-1.jpg"`.

- Todo item de galeria e o mapa precisam de `alt` (descrição para leitores de tela). O gerador recusa texto vazio.
- Use imagens com proporção 4:3 (por exemplo 1200 × 900 pixels) para evitar saltos na página.
- Use somente imagens de sua autoria ou com autorização de uso. Não use fotos de terceiros sem licença.

### 4. Gerar o site

Abra um terminal na pasta do cliente e execute:

```bash
node build.js
```

- Se aparecer um erro, ele indica o campo de `site.json` a corrigir. Corrija e execute de novo.
- Feche qualquer servidor local rodando dentro de `docs/` antes de gerar. No Windows, a pasta em uso não pode ser apagada e a geração falha com `EPERM`.
- Se aparecer um aviso (por exemplo, "textos de demonstração ainda presentes"), revise o texto indicado antes de publicar.

### 5. Conferir o resultado

1. Dê duplo clique em `docs/index.html` para abrir no navegador.
2. Confira todas as seções, os links do menu e as imagens.
3. Teste em largura de celular (ferramentas de desenvolvedor, 375 px) e de computador (1280 px). Não deve haver rolagem horizontal.
4. Em celular, abra e feche o menu.
5. Se houver botão de WhatsApp, confirme que o link abre a conversa com o número certo.

### 6. Rodar os testes (opcional, para quem altera o modelo)

```bash
node --test tests/
```

### 7. Publicar no GitHub Pages

Use a interface web do GitHub, como já feito na demonstração:

1. Crie um repositório **público** com o nome do cliente.
2. Envie o conteúdo da pasta `docs/` para a raiz do repositório. Inclua o arquivo `.nojekyll`, que fica oculto em alguns sistemas; ele impede o processamento automático pelo Jekyll.
3. Em **Settings > Pages**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`.
4. Aguarde alguns minutos e abra o endereço mostrado na página de Pages.

### 8. Atualizar o site depois

1. Edite `site.json` ou as imagens.
2. Execute `node build.js` de novo.
3. Envie para o GitHub os arquivos alterados de `docs/` (substituindo os antigos).

## Checklist antes de entregar

- [ ] `modoDemonstracao` está em `false`.
- [ ] `node build.js` terminou sem erros e sem avisos.
- [ ] Nenhum texto "fictício", "demonstração" ou "R$ 00,00" permanece.
- [ ] Cores têm contraste legível sobre o fundo (texto claro em fundo escuro e vice-versa).
- [ ] Todas as imagens têm descrição (`alt`) real.
- [ ] Telefone, e-mail, WhatsApp e redes foram confirmados pelo cliente.
- [ ] Favicon e imagem de compartilhamento foram definidos (ou o padrão é aceito).
- [ ] `urlCanonica` e `compartilhamento.url` estão preenchidos com o endereço final, se o site já estiver publicado.
- [ ] O site foi testado em celular e computador.
- [ ] O cliente autorizou textos, imagens e dados de contato.

## Compartilhamento e favicon

O gerador cria as tags Open Graph e Twitter Card que as redes sociais usam para montar a pré-visualização do link, e o link do favicon.

- **Título e descrição** de compartilhamento vêm de `compartilhamento` ou, se vazios, de `negocio`.
- **Imagem de compartilhamento** é opcional. Ela é convertida em endereço absoluto usando a URL base do site. Por isso a URL base precisa terminar em `/`. Exemplo para um site no GitHub Pages em subdiretório:

  ```json
  "compartilhamento": {
    "imagem": "imagens/capa.jpg",
    "imagemAlt": "Fachada da barbearia",
    "url": "https://seu-usuario.github.io/nome-do-repositorio/"
  }
  ```

  Resultado: `https://seu-usuario.github.io/nome-do-repositorio/imagens/capa.jpg`.
- **Favicon:** o padrão é `favicon.svg`, copiado para `docs/`. Para usar outro ícone, coloque o arquivo em `imagens/` e preencha `negocio.favicon`.
- **Depois de publicar**, preencha `negocio.urlCanonica` e `compartilhamento.url` com o endereço final e gere o site de novo. Assim o canonical e o `og:url` ficam corretos.
- Redes sociais guardam a pré-visualização em cache. Após alterar a imagem ou o título, a atualização pode levar algum tempo para aparecer.

## Cores

Os campos de `tema` mudam as cores da página. Cada campo tem um papel:

- `fundo`, `superficie`: cores de fundo.
- `texto`, `textoSecundario`: textos principais e secundários.
- `destaque`, `destaqueForte`: botões, títulos de cartões e detalhes.
- `textoSobreDestaque`: texto dentro de botões de destaque.
- `linha`: bordas e divisórias.

Ao trocar cores, confira o contraste. Texto de cor clara sobre fundo claro, ou escura sobre escura, fica ilegível. Um verificador de contraste online gratuito ajuda a conferir.

## Limitações

- Alterações exigem rodar `node build.js` no computador. O GitHub Pages publica o que está em `docs/`, mas não gera o site sozinho.
- Sem JavaScript, o conteúdo e os links do menu aparecem normalmente, em linha. O botão de menu móvel é ocultado, e o aviso de demonstração não aparece ao clicar (o botão não faz nada).
- Não há formulário de contato nem agendamento. Se o cliente precisar, é outro projeto, com serviço externo.
- Os testes automatizados cobrem a geração do HTML e a validação de dados. A navegação e a aparência precisam de conferência manual no navegador.
