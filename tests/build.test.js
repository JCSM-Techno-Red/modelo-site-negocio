// Testes do gerador. Executar com: node --test tests/
// Usa apenas node:test e node:assert (módulos nativos). Os arquivos de teste ficam em tests/.tmp e são apagados.
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { gerar, validar } = require("../build.js");

const RAIZ_MODELO = path.join(__dirname, "..");
const TMP = path.join(__dirname, ".tmp");

// Cria uma cópia do modelo em tests/.tmp/<nome>, com site.json alterado por "mudar".
function criarCopia(nome, mudar) {
  const raiz = path.join(TMP, nome);
  fs.rmSync(raiz, { recursive: true, force: true });
  fs.mkdirSync(raiz, { recursive: true });
  fs.cpSync(path.join(RAIZ_MODELO, "css"), path.join(raiz, "css"), { recursive: true });
  fs.cpSync(path.join(RAIZ_MODELO, "js"), path.join(raiz, "js"), { recursive: true });
  fs.cpSync(path.join(RAIZ_MODELO, "imagens"), path.join(raiz, "imagens"), { recursive: true });
  fs.copyFileSync(path.join(RAIZ_MODELO, "favicon.svg"), path.join(raiz, "favicon.svg"));
  const dados = JSON.parse(fs.readFileSync(path.join(RAIZ_MODELO, "site.json"), "utf8"));
  if (mudar) mudar(dados);
  fs.writeFileSync(path.join(raiz, "site.json"), JSON.stringify(dados, null, 2));
  return raiz;
}

function lerSaida(raiz) {
  return fs.readFileSync(path.join(raiz, "docs", "index.html"), "utf8");
}

test.after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});

test("site.json da demonstração é válido", () => {
  const dados = JSON.parse(fs.readFileSync(path.join(RAIZ_MODELO, "site.json"), "utf8"));
  const { erros } = validar(dados, RAIZ_MODELO);
  assert.deepEqual(erros, []);
});

test("geração da demonstração cria HTML, CSS, JS, imagens e .nojekyll", () => {
  const raiz = criarCopia("demo");
  const { avisos } = gerar(raiz);
  const html = lerSaida(raiz);
  assert.match(html, /<!doctype html>/);
  assert.match(html, /<html lang="pt-BR" class="no-js">/);
  assert.ok(fs.existsSync(path.join(raiz, "docs", "css", "styles.css")));
  assert.ok(fs.existsSync(path.join(raiz, "docs", "js", "menu.js")));
  assert.ok(fs.existsSync(path.join(raiz, "docs", "imagens", "mapa.svg")));
  assert.ok(fs.existsSync(path.join(raiz, "docs", ".nojekyll")));
  assert.ok(Array.isArray(avisos));
});

test("demonstração: seis seções, título de demonstração e nenhum link de WhatsApp real", () => {
  const raiz = criarCopia("demo-seções");
  gerar(raiz);
  const html = lerSaida(raiz);
  for (const id of ["sobre", "servicos", "precos", "galeria", "localizacao", "contato"]) {
    assert.match(html, new RegExp(`<section id="${id}"`), `seção ${id} ausente`);
    assert.match(html, new RegExp(`href="#${id}"`), `link de menu para ${id} ausente`);
  }
  assert.match(html, /<title>Barbearia Navalha \(demonstração fictícia\)<\/title>/);
  assert.doesNotMatch(html, /wa\.me/);
  assert.match(html, /id="btn-whatsapp"/);
  assert.match(html, /<p id="aviso-demo"[^>]* hidden>/);
});

test("alt de imagens e legendas estão presentes na galeria", () => {
  const raiz = criarCopia("galeria");
  gerar(raiz);
  const html = lerSaida(raiz);
  assert.match(html, /alt="Ilustração de cadeira de barbeiro"/);
  assert.match(html, /<figcaption>Cadeira de atendimento<\/figcaption>/);
  assert.match(html, /<img src="imagens\/mapa\.svg"/);
});

test("seção desligada some do HTML e do menu", () => {
  const raiz = criarCopia("sem-galeria", (d) => {
    d.secoes.galeria.ativa = false;
  });
  gerar(raiz);
  const html = lerSaida(raiz);
  assert.doesNotMatch(html, /<section id="galeria"/);
  assert.doesNotMatch(html, /href="#galeria"/);
  assert.match(html, /<section id="precos"/);
});

test("WhatsApp real: link wa.me só com dígitos e sem aviso de demonstração", () => {
  const raiz = criarCopia("whats-real", (d) => {
    d.modoDemonstracao = false;
    d.canais.whatsapp = "+55 (11) 90000-0000";
  });
  gerar(raiz);
  const html = lerSaida(raiz);
  assert.match(html, /href="https:\/\/wa\.me\/5511900000000"/);
  assert.doesNotMatch(html, /id="btn-whatsapp"/);
  assert.doesNotMatch(html, /id="aviso-demo"/);
  assert.doesNotMatch(html, /demonstração fictícia\)<\/title>/);
});

test("sem WhatsApp em modo real: botão de contato não aparece", () => {
  const raiz = criarCopia("sem-whats", (d) => {
    d.modoDemonstracao = false;
    d.canais.whatsapp = "";
  });
  gerar(raiz);
  const html = lerSaida(raiz);
  assert.doesNotMatch(html, /wa\.me/);
  assert.doesNotMatch(html, /id="btn-whatsapp"/);
});

test("texto do cliente é escapado (proteção contra HTML injetado)", () => {
  const raiz = criarCopia("escape", (d) => {
    d.negocio.nome = '<img src=x onerror="alert(1)">';
  });
  gerar(raiz);
  const html = lerSaida(raiz);
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
});

test("dados estruturados (JSON-LD) são JSON válido", () => {
  const raiz = criarCopia("jsonld");
  gerar(raiz);
  const html = lerSaida(raiz);
  const trecho = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(trecho, "bloco JSON-LD ausente");
  const dados = JSON.parse(trecho[1]);
  assert.equal(dados["@type"], "LocalBusiness");
  assert.equal(dados.name, "Barbearia Navalha");
});

test("sem JavaScript: classe no-js é trocada por js antes da pintura (script inline no head)", () => {
  const raiz = criarCopia("nojs");
  gerar(raiz);
  const html = lerSaida(raiz);
  const cabeca = html.split("</head>")[0];
  assert.match(cabeca, /classList\.replace\("no-js", "js"\)/);
  const css = fs.readFileSync(path.join(raiz, "docs", "css", "styles.css"), "utf8");
  assert.match(css, /\.no-js \.site-nav \{[^}]*display: block;/);
  assert.match(css, /\.no-js \.menu-toggle \{ display: none; \}/);
});

test("canonical: aparece quando urlCanonica é https e some quando ausente", () => {
  const com = criarCopia("canonical", (d) => {
    d.negocio.urlCanonica = "https://exemplo.com.br/";
  });
  gerar(com);
  assert.match(lerSaida(com), /<link rel="canonical" href="https:\/\/exemplo\.com\.br\/">/);

  const sem = criarCopia("sem-canonical");
  gerar(sem);
  assert.doesNotMatch(lerSaida(sem), /rel="canonical"/);
});

test("validação: urlCanonica sem https é recusada", () => {
  const raiz = criarCopia("canonical-invalido", (d) => {
    d.negocio.urlCanonica = "http://exemplo.com.br";
  });
  assert.throws(() => gerar(raiz), /urlCanonica deve começar com https/);
});

test("telefone: link tel: contém só dígitos e número curto é recusado", () => {
  const ok = criarCopia("telefone", (d) => {
    d.canais.telefone = "(11) 3000-0000";
  });
  gerar(ok);
  assert.match(lerSaida(ok), /href="tel:\+1130000000"/);

  const curto = criarCopia("telefone-curto", (d) => {
    d.canais.telefone = "12";
  });
  assert.throws(() => gerar(curto), /canais\.telefone deve ter entre 8 e 15/);
});

test("validação: e-mail sem formato válido é recusado", () => {
  const raiz = criarCopia("email", (d) => {
    d.canais.email = "javascript:alert(1)@x";
  });
  assert.throws(() => gerar(raiz), /canais\.email parece inválido/);
});

test("tema personalizado vira variáveis CSS", () => {
  const raiz = criarCopia("tema", (d) => {
    d.tema.destaque = "#1e90ff";
  });
  gerar(raiz);
  assert.match(lerSaida(raiz), /--gold: #1e90ff;/);
});

test("validação: imagem ausente bloqueia a geração", () => {
  const raiz = criarCopia("img-ausente", (d) => {
    d.secoes.galeria.itens[0].arquivo = "imagens/nao-existe.jpg";
  });
  assert.throws(() => gerar(raiz), /arquivo não encontrado: imagens\/nao-existe\.jpg/);
});

test("validação: caminho fora de imagens/ é recusado", () => {
  const raiz = criarCopia("caminho", (d) => {
    d.secoes.galeria.itens[0].arquivo = "../site.json";
  });
  assert.throws(() => gerar(raiz), /dentro de imagens\//);
});

test("validação: alt vazio é recusado (acessibilidade)", () => {
  const raiz = criarCopia("alt", (d) => {
    d.secoes.galeria.itens[0].alt = "";
  });
  assert.throws(() => gerar(raiz), /alt é obrigatório/);
});

test("validação: WhatsApp com número inválido é recusado", () => {
  const raiz = criarCopia("whats-invalido", (d) => {
    d.canais.whatsapp = "123";
  });
  assert.throws(() => gerar(raiz), /canais\.whatsapp/);
});

test("validação: cor fora do formato hexadecimal é recusada", () => {
  const raiz = criarCopia("cor", (d) => {
    d.tema.fundo = "red; background: url(x)";
  });
  assert.throws(() => gerar(raiz), /tema\.fundo deve ser uma cor hexadecimal/);
});

test("validação: seção sem campo 'ativa' é recusada", () => {
  const raiz = criarCopia("sem-ativa", (d) => {
    delete d.secoes.sobre.ativa;
  });
  assert.throws(() => gerar(raiz), /secoes\.sobre\.ativa/);
});

test("validação: precos com colunas diferentes de três é recusado", () => {
  const raiz = criarCopia("colunas", (d) => {
    d.secoes.precos.colunas = ["Serviço", "Valor"];
  });
  assert.throws(() => gerar(raiz), /exatamente 3 títulos/);
});

test("aviso: modo real com texto de demonstração gera alerta, sem bloquear", () => {
  const raiz = criarCopia("aviso", (d) => {
    d.modoDemonstracao = false;
  });
  const { avisos } = gerar(raiz);
  assert.ok(avisos.some((a) => /texto\(s\) de demonstração/.test(a)));
});

test("reconstrução limpa: docs antigo é substituído", () => {
  const raiz = criarCopia("rebuild");
  gerar(raiz);
  fs.writeFileSync(path.join(raiz, "docs", "lixo.txt"), "antigo");
  gerar(raiz);
  assert.equal(fs.existsSync(path.join(raiz, "docs", "lixo.txt")), false);
});

// Arquivo de imagem de compartilhamento falso (o gerador só verifica existência e extensão).
function criarImagemCompartilhamento(raiz) {
  fs.writeFileSync(path.join(raiz, "imagens", "compartilhar.png"), "imagem de teste");
}

function headDe(html) {
  return html.split("</head>")[0];
}

test("Open Graph: valores padrão vêm de negocio quando compartilhamento não existe", () => {
  const raiz = criarCopia("og-padrao");
  gerar(raiz);
  const cabeca = headDe(lerSaida(raiz));
  assert.match(cabeca, /<meta property="og:title" content="Barbearia Navalha">/);
  assert.match(cabeca, /<meta property="og:description" content="Demonstração fictícia de site para barbearia\./);
  assert.match(cabeca, /<meta property="og:site_name" content="Barbearia Navalha">/);
  assert.match(cabeca, /<meta property="og:locale" content="pt_BR">/);
  assert.match(cabeca, /<meta name="twitter:card" content="summary">/);
  assert.doesNotMatch(cabeca, /og:image/);
  assert.doesNotMatch(cabeca, /og:url/);
});

test("Open Graph: título e descrição personalizados são escapados", () => {
  const raiz = criarCopia("og-texto", (d) => {
    d.compartilhamento = { titulo: 'Corte "Navalha" & Cia', descricao: "Agende <já>" };
  });
  gerar(raiz);
  const cabeca = headDe(lerSaida(raiz));
  assert.match(cabeca, /og:title" content="Corte &quot;Navalha&quot; &amp; Cia"/);
  assert.match(cabeca, /og:description" content="Agende &lt;já&gt;"/);
});

test("Open Graph: imagem vira URL absoluta respeitando subdiretório do GitHub Pages", () => {
  const raiz = criarCopia("og-imagem", (d) => {
    d.compartilhamento = {
      imagem: "imagens/compartilhar.png",
      imagemAlt: "Fachada da barbearia",
      url: "https://usuario.github.io/barbearia-navalha-demo/",
    };
  });
  criarImagemCompartilhamento(raiz);
  gerar(raiz);
  const cabeca = headDe(lerSaida(raiz));
  assert.match(cabeca, /<meta property="og:image" content="https:\/\/usuario\.github\.io\/barbearia-navalha-demo\/imagens\/compartilhar\.png">/);
  assert.match(cabeca, /<meta property="og:image:alt" content="Fachada da barbearia">/);
  assert.match(cabeca, /<meta property="og:url" content="https:\/\/usuario\.github\.io\/barbearia-navalha-demo\/">/);
  assert.match(cabeca, /<meta name="twitter:card" content="summary_large_image">/);
});

test("Open Graph: usa negocio.urlCanonica quando compartilhamento.url não é informado", () => {
  const raiz = criarCopia("og-url-canonica", (d) => {
    d.negocio.urlCanonica = "https://exemplo.com.br/";
    d.compartilhamento = { imagem: "imagens/compartilhar.png", imagemAlt: "Logo" };
  });
  criarImagemCompartilhamento(raiz);
  gerar(raiz);
  const cabeca = headDe(lerSaida(raiz));
  assert.match(cabeca, /og:url" content="https:\/\/exemplo\.com\.br\/"/);
  assert.match(cabeca, /og:image" content="https:\/\/exemplo\.com\.br\/imagens\/compartilhar\.png"/);
});

test("validação Open Graph: imagem sem URL base https é recusada", () => {
  const raiz = criarCopia("og-sem-url", (d) => {
    d.compartilhamento = { imagem: "imagens/compartilhar.png", imagemAlt: "Logo" };
  });
  criarImagemCompartilhamento(raiz);
  assert.throws(() => gerar(raiz), /exige uma URL https:\/\/ terminada em \//);
});

test("validação Open Graph: URL base sem barra final é recusada quando há imagem", () => {
  const raiz = criarCopia("og-sem-barra", (d) => {
    d.compartilhamento = { imagem: "imagens/compartilhar.png", imagemAlt: "Logo", url: "https://exemplo.com.br/pagina" };
  });
  criarImagemCompartilhamento(raiz);
  assert.throws(() => gerar(raiz), /terminada em \//);
});

test("validação Open Graph: imagem SVG é recusada (redes sociais não aceitam)", () => {
  const raiz = criarCopia("og-svg", (d) => {
    d.compartilhamento = { imagem: "imagens/mapa.svg", imagemAlt: "Mapa", url: "https://exemplo.com.br/" };
  });
  assert.throws(() => gerar(raiz), /redes sociais não aceitam SVG/);
});

test("validação Open Graph: imagem inexistente é recusada", () => {
  const raiz = criarCopia("og-inexistente", (d) => {
    d.compartilhamento = { imagem: "imagens/nao-existe.png", imagemAlt: "Logo", url: "https://exemplo.com.br/" };
  });
  assert.throws(() => gerar(raiz), /arquivo não encontrado: imagens\/nao-existe\.png/);
});

test("validação Open Graph: imagem sem texto alternativo é recusada", () => {
  const raiz = criarCopia("og-alt", (d) => {
    d.compartilhamento = { imagem: "imagens/compartilhar.png", url: "https://exemplo.com.br/" };
  });
  criarImagemCompartilhamento(raiz);
  assert.throws(() => gerar(raiz), /compartilhamento\.imagemAlt é obrigatório/);
});

test("validação Open Graph: URL http (não https) é recusada", () => {
  const raiz = criarCopia("og-http", (d) => {
    d.compartilhamento = { url: "http://exemplo.com.br/" };
  });
  assert.throws(() => gerar(raiz), /compartilhamento\.url deve começar com https/);
});

test("validação Open Graph: compartilhamento que não é objeto é recusado", () => {
  const raiz = criarCopia("og-tipo", (d) => {
    d.compartilhamento = "texto";
  });
  assert.throws(() => gerar(raiz), /compartilhamento deve ser um objeto/);
});

test("aviso: título de compartilhamento longo não bloqueia, mas é sinalizado", () => {
  const raiz = criarCopia("og-aviso", (d) => {
    d.compartilhamento = { titulo: "x".repeat(80) };
  });
  const { avisos } = gerar(raiz);
  assert.ok(avisos.some((a) => /compartilhamento\.titulo tem mais de 70/.test(a)));
});

test("favicon padrão: link para favicon.svg e arquivo copiado para docs/", () => {
  const raiz = criarCopia("favicon-padrao");
  gerar(raiz);
  const cabeca = headDe(lerSaida(raiz));
  assert.match(cabeca, /<link rel="icon" href="favicon\.svg" type="image\/svg\+xml">/);
  assert.ok(fs.existsSync(path.join(raiz, "docs", "favicon.svg")));
});

test("favicon personalizado: usa o arquivo de imagens/ e não copia o padrão", () => {
  const raiz = criarCopia("favicon-custom", (d) => {
    d.negocio.favicon = "imagens/compartilhar.png";
  });
  criarImagemCompartilhamento(raiz);
  gerar(raiz);
  const cabeca = headDe(lerSaida(raiz));
  assert.match(cabeca, /<link rel="icon" href="imagens\/compartilhar\.png" type="image\/png">/);
  assert.equal(fs.existsSync(path.join(raiz, "docs", "favicon.svg")), false);
  assert.ok(fs.existsSync(path.join(raiz, "docs", "imagens", "compartilhar.png")));
});

test("validação favicon: extensão não suportada é recusada", () => {
  const raiz = criarCopia("favicon-ext", (d) => {
    d.negocio.favicon = "imagens/galeria-1.jpg";
  });
  assert.throws(() => gerar(raiz), /negocio\.favicon deve ser um arquivo \.svg, \.png ou \.ico/);
});

test("validação favicon: arquivo personalizado inexistente é recusado", () => {
  const raiz = criarCopia("favicon-inexistente", (d) => {
    d.negocio.favicon = "imagens/nao-existe.png";
  });
  assert.throws(() => gerar(raiz), /arquivo não encontrado: imagens\/nao-existe\.png/);
});

test("validação favicon: favicon.svg padrão ausente é recusado", () => {
  const raiz = criarCopia("favicon-sem-padrao");
  fs.rmSync(path.join(raiz, "favicon.svg"));
  assert.throws(() => gerar(raiz), /favicon\.svg padrão não encontrado/);
});
