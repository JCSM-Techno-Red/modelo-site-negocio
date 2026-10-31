// Gerador do site estático. Usa apenas Node.js nativo, sem dependências.
// Uso: node build.js
// Lê site.json e grava a pasta docs/ (HTML completo, CSS, JS e imagens).
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const RAIZ = __dirname;
const SECOES = ["sobre", "servicos", "precos", "galeria", "localizacao", "contato"];

// Escapa texto para uso dentro de HTML. Todo dado do cliente passa por aqui.
function escaparHtml(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function coletarTextos(valor, saida = []) {
  if (typeof valor === "string") {
    saida.push(valor);
  } else if (Array.isArray(valor)) {
    valor.forEach((item) => coletarTextos(item, saida));
  } else if (valor && typeof valor === "object") {
    Object.values(valor).forEach((item) => coletarTextos(item, saida));
  }
  return saida;
}

// Valida site.json. Retorna erros (bloqueiam a geração) e avisos (não bloqueiam).
function validar(d, raiz) {
  const erros = [];
  const avisos = [];

  if (!d || typeof d !== "object") {
    return { erros: ["site.json deve conter um objeto JSON."], avisos };
  }

  const texto = (valor, caminho) => {
    if (typeof valor !== "string" || valor.trim() === "") {
      erros.push(`${caminho} é obrigatório (texto não vazio).`);
    }
  };

  const lista = (valor, caminho) => {
    if (!Array.isArray(valor)) {
      erros.push(`${caminho} deve ser uma lista.`);
      return [];
    }
    return valor;
  };

  const imagem = (arquivo, caminho) => {
    if (typeof arquivo !== "string" || !arquivo.startsWith("imagens/") || arquivo.includes("..")) {
      erros.push(`${caminho}: use um caminho dentro de imagens/ (ex.: imagens/foto.jpg).`);
      return;
    }
    if (!fs.existsSync(path.join(raiz, arquivo))) {
      erros.push(`${caminho}: arquivo não encontrado: ${arquivo}`);
    }
  };

  if (typeof d.modoDemonstracao !== "boolean") {
    erros.push("modoDemonstracao deve ser true ou false.");
  }

  const n = d.negocio || {};
  if (!d.negocio) erros.push("negocio é obrigatório.");
  ["nome", "marca", "inicial", "titulo", "descricao", "endereco"].forEach((c) => texto(n[c], `negocio.${c}`));
  if (!Array.isArray(n.horarios) || n.horarios.length === 0) {
    erros.push("negocio.horarios deve ser uma lista com ao menos um horário.");
  } else {
    n.horarios.forEach((h, i) => texto(h, `negocio.horarios[${i}]`));
  }

  const tema = d.tema || {};
  Object.keys(tema).forEach((chave) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(tema[chave])) {
      erros.push(`tema.${chave} deve ser uma cor hexadecimal, como #d4a84b.`);
    }
  });

  const canais = d.canais || {};
  const digitos = typeof canais.whatsapp === "string" ? canais.whatsapp.replace(/\D/g, "") : "";
  if (canais.whatsapp && (typeof canais.whatsapp !== "string" || digitos.length < 10 || digitos.length > 15)) {
    erros.push("canais.whatsapp deve ter o número com DDI e DDD, somente dígitos (ex.: 5511900000000).");
  }
  if (canais.telefone) {
    const digitosTelefone = typeof canais.telefone === "string" ? canais.telefone.replace(/\D/g, "") : "";
    if (digitosTelefone.length < 8 || digitosTelefone.length > 15) {
      erros.push("canais.telefone deve ter entre 8 e 15 dígitos (ex.: (11) 3000-0000).");
    }
  }
  if (canais.email && (typeof canais.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(canais.email))) {
    erros.push("canais.email parece inválido (ex.: contato@exemplo.com.br).");
  }
  if (n.urlCanonica !== undefined && n.urlCanonica !== "") {
    if (typeof n.urlCanonica !== "string" || !/^https:\/\/[^\s"<>]+$/.test(n.urlCanonica)) {
      erros.push("negocio.urlCanonica deve começar com https:// e não conter espaços.");
    }
  }
  lista(canais.redes || [], "canais.redes").forEach((rede, i) => {
    texto(rede && rede.nome, `canais.redes[${i}].nome`);
    if (!rede || typeof rede.url !== "string" || !rede.url.startsWith("https://")) {
      erros.push(`canais.redes[${i}].url deve começar com https://`);
    }
  });

  const hero = d.hero || {};
  if (!d.hero) erros.push("hero é obrigatório.");
  ["rotulo", "titulo", "texto", "botaoPrincipal", "botaoSecundario"].forEach((c) => texto(hero[c], `hero.${c}`));

  const secoes = d.secoes || {};
  SECOES.forEach((sec) => {
    const b = secoes[sec];
    if (!b || typeof b.ativa !== "boolean") {
      erros.push(`secoes.${sec}.ativa deve ser true ou false.`);
      return;
    }
    if (!b.ativa) return;

    texto(b.rotulo, `secoes.${sec}.rotulo`);
    texto(b.titulo, `secoes.${sec}.titulo`);

    if (sec === "sobre") {
      lista(b.paragrafos, "secoes.sobre.paragrafos").forEach((p, i) => texto(p, `secoes.sobre.paragrafos[${i}]`));
      lista(b.destaques, "secoes.sobre.destaques").forEach((x, i) => {
        texto(x && x.titulo, `secoes.sobre.destaques[${i}].titulo`);
        texto(x && x.texto, `secoes.sobre.destaques[${i}].texto`);
      });
    }

    if (sec === "servicos") {
      lista(b.itens, "secoes.servicos.itens").forEach((it, i) => {
        texto(it && it.nome, `secoes.servicos.itens[${i}].nome`);
        texto(it && it.descricao, `secoes.servicos.itens[${i}].descricao`);
      });
    }

    if (sec === "precos") {
      texto(b.legenda, "secoes.precos.legenda");
      if (!Array.isArray(b.colunas) || b.colunas.length !== 3) {
        erros.push("secoes.precos.colunas deve ter exatamente 3 títulos.");
      }
      lista(b.itens, "secoes.precos.itens").forEach((it, i) => {
        texto(it && it.nome, `secoes.precos.itens[${i}].nome`);
        texto(it && it.duracao, `secoes.precos.itens[${i}].duracao`);
        texto(it && it.valor, `secoes.precos.itens[${i}].valor`);
      });
    }

    if (sec === "galeria") {
      lista(b.itens, "secoes.galeria.itens").forEach((it, i) => {
        imagem(it && it.arquivo, `secoes.galeria.itens[${i}].arquivo`);
        texto(it && it.alt, `secoes.galeria.itens[${i}].alt`);
        texto(it && it.legenda, `secoes.galeria.itens[${i}].legenda`);
      });
    }

    if (sec === "localizacao") {
      texto(b.tituloHorarios, "secoes.localizacao.tituloHorarios");
      const mapa = b.mapa || {};
      imagem(mapa.arquivo, "secoes.localizacao.mapa.arquivo");
      texto(mapa.alt, "secoes.localizacao.mapa.alt");
      texto(mapa.legenda, "secoes.localizacao.mapa.legenda");
    }

    if (sec === "contato") {
      texto(b.texto, "secoes.contato.texto");
      texto(b.botao, "secoes.contato.botao");
    }
  });

  // Favicon: padrão é favicon.svg na raiz do modelo; personalizado precisa estar em imagens/.
  if (n.favicon !== undefined && n.favicon !== "") {
    if (typeof n.favicon !== "string" || !/\.(svg|png|ico)$/i.test(n.favicon)) {
      erros.push("negocio.favicon deve ser um arquivo .svg, .png ou .ico dentro de imagens/.");
    } else {
      imagem(n.favicon, "negocio.favicon");
    }
  } else if (!fs.existsSync(path.join(raiz, "favicon.svg"))) {
    erros.push("favicon.svg padrão não encontrado na pasta do modelo.");
  }

  // Compartilhamento (Open Graph e Twitter Card). Todos os campos são opcionais, exceto imagemAlt quando há imagem.
  const comp = d.compartilhamento;
  if (comp !== undefined && (typeof comp !== "object" || comp === null || Array.isArray(comp))) {
    erros.push("compartilhamento deve ser um objeto.");
  }
  const c2 = comp && typeof comp === "object" ? comp : {};
  if (c2.titulo !== undefined) {
    texto(c2.titulo, "compartilhamento.titulo");
    if (typeof c2.titulo === "string" && c2.titulo.length > 70) avisos.push("compartilhamento.titulo tem mais de 70 caracteres e pode ser cortado nas redes sociais.");
  }
  if (c2.descricao !== undefined) {
    texto(c2.descricao, "compartilhamento.descricao");
    if (typeof c2.descricao === "string" && c2.descricao.length > 200) avisos.push("compartilhamento.descricao tem mais de 200 caracteres e pode ser cortada nas redes sociais.");
  }
  const urlHttps = (u) => typeof u === "string" && /^https:\/\/[^\s"<>]+$/.test(u);
  const urlCompartilhamento = c2.url !== undefined && c2.url !== "" ? c2.url : n.urlCanonica;
  if (c2.url !== undefined && c2.url !== "" && !urlHttps(c2.url)) {
    erros.push("compartilhamento.url deve começar com https:// e não conter espaços.");
  }
  if (c2.imagem !== undefined && c2.imagem !== "") {
    if (typeof c2.imagem !== "string" || !/\.(jpe?g|png|webp)$/i.test(c2.imagem)) {
      erros.push("compartilhamento.imagem deve ser .jpg, .png ou .webp (redes sociais não aceitam SVG).");
    } else {
      imagem(c2.imagem, "compartilhamento.imagem");
    }
    texto(c2.imagemAlt, "compartilhamento.imagemAlt");
    if (!urlHttps(urlCompartilhamento) || !urlCompartilhamento.endsWith("/")) {
      erros.push("compartilhamento.imagem exige uma URL https:// terminada em / (em compartilhamento.url ou negocio.urlCanonica).");
    }
  }

  if (d.modoDemonstracao === false) {
    const achados = coletarTextos(d).filter((t) => /fictíci|demonstra/i.test(t));
    if (achados.length > 0) {
      avisos.push(`Ainda há ${achados.length} texto(s) de demonstração. Revise antes de publicar.`);
    }
    if (!digitos && secoes.contato && secoes.contato.ativa) {
      avisos.push("Sem WhatsApp configurado: o botão de contato não aparecerá.");
    }
  }
  if (d.modoDemonstracao === true && digitos) {
    avisos.push("Modo demonstração ativo: o WhatsApp não aparece como link. Use modoDemonstracao: false para um cliente real.");
  }

  return { erros, avisos };
}

function renderMenu(d) {
  return SECOES.filter((c) => d.secoes[c].ativa)
    .map((c) => `<li><a href="#${c}">${escaparHtml(d.secoes[c].rotulo)}</a></li>`)
    .join("\n          ");
}

function renderHero(d) {
  const h = d.hero;
  const acoes = [];
  if (d.secoes.contato.ativa) {
    acoes.push(`<a class="btn btn-primary" href="#contato">${escaparHtml(h.botaoPrincipal)}</a>`);
  }
  if (d.secoes.servicos.ativa) {
    acoes.push(`<a class="btn btn-ghost" href="#servicos">${escaparHtml(h.botaoSecundario)}</a>`);
  }
  return `<section id="inicio" class="hero">
    <div class="container hero-inner">
      <p class="eyebrow">${escaparHtml(h.rotulo)}</p>
      <h1>${escaparHtml(h.titulo)}</h1>
      <p class="lead">${escaparHtml(h.texto)}</p>${acoes.length ? `
      <div class="hero-actions">
        ${acoes.join("\n        ")}
      </div>` : ""}
    </div>
  </section>`;
}

function renderSobre(s) {
  const paragrafos = s.paragrafos.map((p) => `<p>${escaparHtml(p)}</p>`).join("\n        ");
  const destaques = s.destaques
    .map((x) => `<li><strong>${escaparHtml(x.titulo)}</strong><span>${escaparHtml(x.texto)}</span></li>`)
    .join("\n          ");
  return `<section id="sobre" class="section">
    <div class="container split">
      <div>
        <p class="eyebrow">${escaparHtml(s.rotulo)}</p>
        <h2>${escaparHtml(s.titulo)}</h2>
        ${paragrafos}
      </div>
      <ul class="facts" aria-label="Pontos de destaque">
          ${destaques}
      </ul>
    </div>
  </section>`;
}

function renderServicos(s) {
  const cartoes = s.itens
    .map((it) => `<article class="card">
            <h3>${escaparHtml(it.nome)}</h3>
            <p>${escaparHtml(it.descricao)}</p>
          </article>`)
    .join("\n          ");
  return `<section id="servicos" class="section section-alt">
    <div class="container">
      <p class="eyebrow">${escaparHtml(s.rotulo)}</p>
      <h2>${escaparHtml(s.titulo)}</h2>
      <div class="cards">
          ${cartoes}
      </div>
    </div>
  </section>`;
}

function renderPrecos(s) {
  const cabecalho = s.colunas.map((c) => `<th scope="col">${escaparHtml(c)}</th>`).join("");
  const linhas = s.itens
    .map((it) => `<tr><th scope="row">${escaparHtml(it.nome)}</th><td>${escaparHtml(it.duracao)}</td><td>${escaparHtml(it.valor)}</td></tr>`)
    .join("\n              ");
  const aviso = s.aviso ? `\n      <p class="note">${escaparHtml(s.aviso)}</p>` : "";
  return `<section id="precos" class="section">
    <div class="container">
      <p class="eyebrow">${escaparHtml(s.rotulo)}</p>
      <h2>${escaparHtml(s.titulo)}</h2>${aviso}
      <div class="table-wrap">
        <table>
          <caption class="sr-only">${escaparHtml(s.legenda)}</caption>
          <thead>
            <tr>${cabecalho}</tr>
          </thead>
          <tbody>
              ${linhas}
          </tbody>
        </table>
      </div>
    </div>
  </section>`;
}

function renderGaleria(s) {
  const figuras = s.itens
    .map((it) => `<figure><img src="${escaparHtml(it.arquivo)}" alt="${escaparHtml(it.alt)}" loading="lazy" width="600" height="450"><figcaption>${escaparHtml(it.legenda)}</figcaption></figure>`)
    .join("\n          ");
  const aviso = s.aviso ? `\n      <p class="note">${escaparHtml(s.aviso)}</p>` : "";
  return `<section id="galeria" class="section section-alt">
    <div class="container">
      <p class="eyebrow">${escaparHtml(s.rotulo)}</p>
      <h2>${escaparHtml(s.titulo)}</h2>${aviso}
      <div class="gallery">
          ${figuras}
      </div>
    </div>
  </section>`;
}

function renderLocalizacao(s, negocio) {
  const etiqueta = s.etiqueta ? `\n        <p class="fictional-tag">${escaparHtml(s.etiqueta)}</p>` : "";
  const horarios = negocio.horarios.map((h) => `<li>${escaparHtml(h)}</li>`).join("");
  return `<section id="localizacao" class="section">
    <div class="container split">
      <div>
        <p class="eyebrow">${escaparHtml(s.rotulo)}</p>
        <h2>${escaparHtml(s.titulo)}</h2>${etiqueta}
        <address>
          <span>${escaparHtml(negocio.endereco)}</span>
        </address>
        <h3>${escaparHtml(s.tituloHorarios)}</h3>
        <ul class="hours">${horarios}</ul>
      </div>
      <figure class="map">
        <img src="${escaparHtml(s.mapa.arquivo)}" alt="${escaparHtml(s.mapa.alt)}" loading="lazy" width="600" height="450">
        <figcaption>${escaparHtml(s.mapa.legenda)}</figcaption>
      </figure>
    </div>
  </section>`;
}

function renderContato(d) {
  const s = d.secoes.contato;
  const c = d.canais;
  const digitos = (c.whatsapp || "").replace(/\D/g, "");

  const links = [];
  if (c.telefone) links.push(`<li><a href="tel:+${escaparHtml(c.telefone.replace(/\D/g, ""))}">${escaparHtml(c.telefone)}</a></li>`);
  if (c.email) links.push(`<li><a href="mailto:${escaparHtml(c.email)}">${escaparHtml(c.email)}</a></li>`);
  (c.redes || []).forEach((r) => links.push(`<li><a href="${escaparHtml(r.url)}">${escaparHtml(r.nome)}</a></li>`));
  const lista = links.length ? `\n      <ul class="hours" aria-label="Canais de contato">${links.join("")}</ul>` : "";

  let botao = "";
  if (d.modoDemonstracao) {
    // Demonstração: nenhum link real. O clique só mostra o aviso (ver js/menu.js).
    botao = `\n      <button class="btn btn-primary" type="button" id="btn-whatsapp" aria-describedby="aviso-demo">${escaparHtml(s.botao)}</button>
      <p id="aviso-demo" class="demo-notice" role="status" aria-live="polite" hidden>${escaparHtml(c.avisoDemonstracao || "Demonstração: este botão não abre nenhuma conversa real.")}</p>`;
  } else if (digitos.length >= 10) {
    botao = `\n      <a class="btn btn-primary" href="https://wa.me/${digitos}">${escaparHtml(s.botao)}</a>`;
  }

  return `<section id="contato" class="section section-cta">
    <div class="container cta">
      <p class="eyebrow">${escaparHtml(s.rotulo)}</p>
      <h2>${escaparHtml(s.titulo)}</h2>
      <p>${escaparHtml(s.texto)}</p>${lista}${botao}
    </div>
  </section>`;
}

function renderRodape(d) {
  const demo = d.modoDemonstracao
    ? `\n      <p>Nenhum estabelecimento real está representado nesta página.</p>`
    : "";
  const aviso = d.modoDemonstracao ? " · Site de demonstração com dados fictícios." : "";
  return `<footer class="site-footer">
    <div class="container footer-inner">
      <p><strong>${escaparHtml(d.negocio.nome)}</strong>${aviso}</p>${demo}
    </div>
  </footer>`;
}

// Dados estruturados (schema.org) para mecanismos de busca. Gerados a partir de site.json.
function renderDadosEstruturados(d) {
  const dados = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: d.negocio.nome,
    description: d.negocio.descricao,
    address: d.negocio.endereco,
  };
  if (d.canais.telefone) dados.telephone = d.canais.telefone;
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}

function renderTema(d) {
  const variaveis = {
    fundo: "--bg",
    superficie: "--surface",
    texto: "--text",
    textoSecundario: "--muted",
    destaque: "--gold",
    destaqueForte: "--gold-strong",
    textoSobreDestaque: "--on-gold",
    linha: "--line",
  };
  const linhas = Object.keys(variaveis)
    .filter((chave) => d.tema[chave])
    .map((chave) => `${variaveis[chave]}: ${d.tema[chave]};`);
  return linhas.length ? `<style>:root { ${linhas.join(" ")} }</style>` : "";
}

// Metadados de compartilhamento (Open Graph e Twitter Card). Usa valores de negocio como padrão.
function renderCompartilhamento(d) {
  const comp = d.compartilhamento || {};
  const url = comp.url || d.negocio.urlCanonica || "";
  const linhas = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:site_name" content="${escaparHtml(d.negocio.nome)}">`,
    `<meta property="og:title" content="${escaparHtml(comp.titulo || d.negocio.titulo)}">`,
    `<meta property="og:description" content="${escaparHtml(comp.descricao || d.negocio.descricao)}">`,
  ];
  if (url) linhas.push(`<meta property="og:url" content="${escaparHtml(url)}">`);
  if (comp.imagem) {
    // Caminho relativo à URL base do site, convertido em URL absoluta (exigida pelas redes sociais).
    const absoluta = new URL(comp.imagem, url).href;
    linhas.push(`<meta property="og:image" content="${escaparHtml(absoluta)}">`);
    linhas.push(`<meta property="og:image:alt" content="${escaparHtml(comp.imagemAlt)}">`);
  }
  linhas.push(`<meta name="twitter:card" content="${comp.imagem ? "summary_large_image" : "summary"}">`);
  return linhas.join("\n  ");
}

function renderFavicon(d) {
  const arquivo = d.negocio.favicon || "favicon.svg";
  const tipos = { ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };
  const tipo = tipos[path.extname(arquivo).toLowerCase()];
  return `<link rel="icon" href="${escaparHtml(arquivo)}" type="${tipo}">`;
}

function renderPagina(d) {
  const titulo = d.negocio.titulo + (d.modoDemonstracao ? " (demonstração fictícia)" : "");
  const canonical = d.negocio.urlCanonica
    ? `<link rel="canonical" href="${escaparHtml(d.negocio.urlCanonica)}">`
    : "";
  const secoes = {
    sobre: () => renderSobre(d.secoes.sobre),
    servicos: () => renderServicos(d.secoes.servicos),
    precos: () => renderPrecos(d.secoes.precos),
    galeria: () => renderGaleria(d.secoes.galeria),
    localizacao: () => renderLocalizacao(d.secoes.localizacao, d.negocio),
    contato: () => renderContato(d),
  };
  const corpo = SECOES.filter((c) => d.secoes[c].ativa)
    .map((c) => secoes[c]())
    .join("\n\n  ");

  return `<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escaparHtml(titulo)}</title>
  <meta name="description" content="${escaparHtml(d.negocio.descricao)}">
  ${canonical}
  ${renderCompartilhamento(d)}
  ${renderFavicon(d)}
  <script>document.documentElement.classList.replace("no-js", "js");</script>
  <link rel="stylesheet" href="css/styles.css">
  ${renderTema(d)}
  <script type="application/ld+json">${renderDadosEstruturados(d)}</script>
</head>
<body>
  <a class="skip-link" href="#principal">Pular para o conteúdo</a>

  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#inicio" aria-label="${escaparHtml(d.negocio.nome)}, início">
        <span class="brand-mark" aria-hidden="true">${escaparHtml(d.negocio.inicial)}</span>
        <span class="brand-name">${escaparHtml(d.negocio.marca)}</span>
      </a>

      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Abrir menu">
        <span class="menu-icon" aria-hidden="true"></span>
      </button>

      <nav id="menu" class="site-nav" aria-label="Principal">
        <ul>
          ${renderMenu(d)}
        </ul>
      </nav>
    </div>
  </header>

  <main id="principal">
  ${renderHero(d)}

  ${corpo}
  </main>

  ${renderRodape(d)}

  <script src="js/menu.js" defer></script>
</body>
</html>
`;
}

// Gera a pasta docs/ a partir de site.json. Lança erro se os dados forem inválidos.
function gerar(raiz = RAIZ) {
  const caminho = path.join(raiz, "site.json");
  const dados = JSON.parse(fs.readFileSync(caminho, "utf8"));
  const { erros, avisos } = validar(dados, raiz);
  if (erros.length > 0) {
    throw new Error("site.json inválido:\n- " + erros.join("\n- "));
  }

  const destino = path.join(raiz, "docs");
  fs.rmSync(destino, { recursive: true, force: true });
  fs.mkdirSync(path.join(destino, "css"), { recursive: true });
  fs.mkdirSync(path.join(destino, "js"), { recursive: true });

  fs.writeFileSync(path.join(destino, "index.html"), renderPagina(dados));
  fs.copyFileSync(path.join(raiz, "css", "styles.css"), path.join(destino, "css", "styles.css"));
  fs.copyFileSync(path.join(raiz, "js", "menu.js"), path.join(destino, "js", "menu.js"));
  if (!dados.negocio.favicon) {
    fs.copyFileSync(path.join(raiz, "favicon.svg"), path.join(destino, "favicon.svg"));
  }
  fs.cpSync(path.join(raiz, "imagens"), path.join(destino, "imagens"), { recursive: true });
  // Evita que o GitHub Pages processe a pasta com Jekyll.
  fs.writeFileSync(path.join(destino, ".nojekyll"), "");

  return { destino, avisos };
}

module.exports = { gerar, validar, renderPagina, escaparHtml };

if (require.main === module) {
  try {
    const { destino, avisos } = gerar();
    console.log(`Site gerado em: ${destino}`);
    avisos.forEach((aviso) => console.warn(`Aviso: ${aviso}`));
  } catch (erro) {
    console.error(erro.message);
    process.exit(1);
  }
}
