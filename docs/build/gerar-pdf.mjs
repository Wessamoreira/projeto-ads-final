import { marked } from 'marked';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsDir = join(__dirname, '..');
const mermaidPath = join(__dirname, 'node_modules/mermaid/dist/mermaid.min.js');

// ---------- Markdown -> HTML (com tratamento de blocos mermaid) ----------
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const renderer = new marked.Renderer();
renderer.code = function (codeArg, infoArg) {
  let code, lang;
  if (typeof codeArg === 'object' && codeArg !== null) {
    code = codeArg.text; lang = codeArg.lang;
  } else {
    code = codeArg; lang = infoArg;
  }
  lang = (lang || '').trim().split(/\s+/)[0];
  if (lang === 'mermaid') return `<pre class="mermaid">${escapeHtml(code)}</pre>`;
  return `<pre class="code"><code>${escapeHtml(code)}</code></pre>`;
};
marked.setOptions({ renderer, gfm: true, breaks: false });

// ---------- Template ----------
const CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1a202c; font-size: 11.5pt; line-height: 1.55; }
  h1 { font-size: 19pt; color: #14304d; border-bottom: 3px solid #14304d; padding-bottom: 6px; margin-top: 0; }
  h2 { font-size: 15pt; color: #1e4060; margin-top: 1.4em; border-bottom: 1px solid #cbd5e0; padding-bottom: 3px; }
  h3 { font-size: 12.5pt; color: #2d3748; }
  p, li { text-align: justify; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }
  th, td { border: 1px solid #cbd5e0; padding: 5px 8px; text-align: left; vertical-align: top; }
  th { background: #14304d; color: #fff; }
  tr:nth-child(even) td { background: #f1f5f9; }
  pre.code { background: #0f172a; color: #e2e8f0; padding: 10px 12px; border-radius: 6px; font-size: 9pt; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
  code { font-family: "SF Mono", Menlo, Consolas, monospace; }
  p code, li code, td code { background: #edf2f7; color: #c026d3; padding: 1px 4px; border-radius: 3px; font-size: 9.5pt; }
  blockquote { border-left: 4px solid #14304d; background: #f8fafc; margin: 10px 0; padding: 6px 14px; color: #334155; }
  pre.mermaid { text-align: center; margin: 16px 0; }
  pre.mermaid svg { max-width: 100%; height: auto; }
  .doc { page-break-before: always; }
  .capa { height: 247mm; display: flex; flex-direction: column; justify-content: center; text-align: center; page-break-after: always; }
  .capa-topo { letter-spacing: 1px; color: #64748b; font-size: 10pt; text-transform: uppercase; }
  .capa-titulo { font-size: 28pt; border: none; margin: 18px 0 6px; }
  .capa-sub { font-size: 13pt; color: #475569; margin-bottom: 40px; }
  .capa-box { border: 1px solid #cbd5e0; border-radius: 8px; padding: 16px 20px; margin: 0 auto; max-width: 72%; background: #f8fafc; font-size: 11pt; }
  .capa-rodape { margin-top: 50px; color: #64748b; font-size: 9.5pt; }
  .sumario { page-break-after: always; }
  .sumario ol { font-size: 12pt; line-height: 2; }
`;

function capaHtml(titulo, subtitulo, documentos) {
  const dataExtenso = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  return `
  <section class="capa">
    <div class="capa-topo">CENTRO UNIVERSITÁRIO — ANÁLISE E DESENVOLVIMENTO DE SISTEMAS</div>
    <h1 class="capa-titulo">${titulo}</h1>
    <div class="capa-sub">${subtitulo}</div>
    <div class="capa-box">
      <strong>Integrantes do grupo:</strong><br/>
      [ Preencher: Nome Completo — Matrícula ]<br/>
      [ Preencher: Nome Completo — Matrícula ]
    </div>
    <div class="capa-rodape">
      Backend: Java 21 · Spring Boot · PostgreSQL &nbsp;|&nbsp; Frontend: React · TypeScript · Vite<br/>
      ${dataExtenso}
    </div>
  </section>
  <section class="sumario">
    <h2>Sumário</h2>
    <ol>${documentos.map((d) => `<li>${d.titulo}</li>`).join('')}</ol>
  </section>`;
}

function montarHtml(titulo, subtitulo, documentos, outFile) {
  let corpo = '';
  for (const doc of documentos) {
    let md;
    try {
      md = readFileSync(join(docsDir, doc.arquivo), 'utf8');
    } catch {
      console.warn('Aviso: não encontrei', doc.arquivo, '— pulando.');
      continue;
    }
    corpo += `<section class="doc">${marked.parse(md)}</section>`;
  }

  const html = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"/><title>${titulo}</title>
<style>${CSS}</style></head><body>
${capaHtml(titulo, subtitulo, documentos)}
${corpo}
<script src="file://${mermaidPath}"></script>
<script>
  mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'loose', flowchart: { htmlLabels: true } });
  window.addEventListener('load', function () {
    mermaid.run({ querySelector: 'pre.mermaid' }).then(function () { document.title = 'PRONTO'; });
  });
</script></body></html>`;

  const saida = join(__dirname, outFile);
  writeFileSync(saida, html, 'utf8');
  console.log('HTML gerado:', saida);
}

// ---------- PDF 1: Documentação formal (entrega) ----------
montarHtml(
  'Controle Financeiro Pessoal',
  'Documentação Técnica do Trabalho de Conclusão de Curso',
  [
    { arquivo: 'diagramas/00-requisitos.md',               titulo: 'Documento de Requisitos' },
    { arquivo: 'diagramas/01-casos-de-uso.md',             titulo: 'Diagrama de Casos de Uso' },
    { arquivo: 'diagramas/03-modelo-logico-relacional.md', titulo: 'Modelo Lógico Relacional' },
    { arquivo: 'diagramas/02-diagrama-de-classes.md',      titulo: 'Diagrama de Classes' },
    { arquivo: 'diagramas/04-diagramas-de-sequencia.md',   titulo: 'Diagramas de Sequência' },
    { arquivo: 'ARQUITETURA-E-SEGURANCA.md',               titulo: 'Arquitetura e Segurança' },
    { arquivo: 'SEGURANCA-DETALHADA.md',                   titulo: 'Segurança — Detalhamento Técnico' },
    { arquivo: 'ARQUITETURA-FRONTEND.md',                  titulo: 'Arquitetura do Frontend' },
    { arquivo: 'TESTES-AUTOMATIZADOS.md',                  titulo: 'Testes Automatizados' },
    { arquivo: 'RENDA_MENSAL_AUTOMATICA.md',               titulo: 'Apêndice — Renda Mensal Automática' },
  ],
  'Documentacao.html'
);

// ---------- PDF 2: Guia de apresentação/defesa (uso pessoal) ----------
montarHtml(
  'Guia de Apresentação e Defesa',
  'Roteiro técnico para a banca — segurança, breakpoints e testes',
  [
    { arquivo: 'ARQUITETURA-E-SEGURANCA.md', titulo: 'Visão Geral e Roteiro de Defesa' },
    { arquivo: 'SEGURANCA-DETALHADA.md',     titulo: 'Segurança — Detalhamento Técnico' },
    { arquivo: 'ROTEIRO-DEMO.md',            titulo: 'Roteiro de Demonstração (Postman + Breakpoints)' },
    { arquivo: 'GUIA-BREAKPOINTS.md',        titulo: 'Guia de Breakpoints por Conceito' },
    { arquivo: 'TESTES-POSTMAN.md',          titulo: 'Testes da API (Postman / curl)' },
    { arquivo: 'TESTES-AUTOMATIZADOS.md',    titulo: 'Testes Automatizados (JUnit)' },
    { arquivo: 'ARQUITETURA-FRONTEND.md',    titulo: 'Arquitetura do Frontend' },
  ],
  'Apresentacao.html'
);
