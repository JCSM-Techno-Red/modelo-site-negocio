# Modelo de site para pequenos negócios

Base reutilizável para criar sites estáticos e simples para diferentes negócios. O conteúdo de cada cliente fica em `site.json`, e o gerador `build.js` produz o site em `docs/`.

Este modelo nasceu da demonstração Barbearia Navalha. O arquivo `site.json` atual contém os dados da demonstração.

## Estrutura

```
modelo-site-negocio/
├── site.json          # conteúdo do cliente (único arquivo a editar)
├── build.js           # gerador: lê site.json e grava docs/ (Node.js, sem dependências)
├── favicon.svg        # ícone padrão da aba do navegador
├── css/styles.css     # estilo base (cores vêm de site.json)
├── js/menu.js         # menu móvel e aviso de demonstração
├── imagens/           # imagens do cliente
├── docs/              # saída gerada: é esta pasta que vai para o GitHub Pages
├── tests/build.test.js # testes automatizados do gerador
├── COMO-USAR.md       # passo a passo para criar um site de cliente
└── ARQUITETURA.md     # por que o modelo gera HTML estático
```

## Comandos

```bash
node build.js            # gera docs/ a partir de site.json
node --test tests/       # executa os testes do gerador
```

Não há `npm install`: o projeto usa apenas recursos do próprio Node.js.

## Princípios

- **Conteúdo separado do código.** O cliente muda `site.json` e as imagens, sem mexer em HTML.
- **HTML completo gerado.** O conteúdo está no HTML final, o que ajuda SEO e funciona sem JavaScript.
- **Dados validados antes da geração.** Erros de imagem, cor, WhatsApp ou texto obrigatório são avisados e impedem a geração.
- **Custo zero.** Sem serviços pagos, sem APIs e sem bibliotecas externas.
- **Publicação gratuita.** A pasta `docs/` é compatível com GitHub Pages.
- **Compartilhamento e favicon configuráveis.** Tags Open Graph, Twitter Card, canonical e favicon são geradas a partir de `site.json`, com validação dos campos. Detalhes em [COMO-USAR.md](COMO-USAR.md#compartilhamento-e-favicon).

## Próximos passos

Para criar um novo site, siga [COMO-USAR.md](COMO-USAR.md). Para entender a decisão de arquitetura, leia [ARQUITETURA.md](ARQUITETURA.md).
