# Documentação Técnica — Diagramas

Esta pasta reúne os diagramas de modelagem do sistema de **Controle Financeiro**, usados na documentação do TCC. Os diagramas estão escritos em **Mermaid**, que o GitHub renderiza automaticamente como imagem ao abrir cada arquivo `.md`.

## Índice

| # | Documento | Conteúdo |
|---|-----------|----------|
| 01 | [Casos de Uso](01-casos-de-uso.md) | Atores e funcionalidades (Mermaid + PlantUML). |
| 02 | [Diagrama de Classes](02-diagrama-de-classes.md) | Modelo de domínio e visão de camadas. |
| 03 | [Modelo Lógico Relacional](03-modelo-logico-relacional.md) | Diagrama ER, dicionário de dados e DDL. |
| 04 | [Diagramas de Sequência](04-diagramas-de-sequencia.md) | Registro, login, transação, dashboard e job de renda. |

## Como visualizar

- **No GitHub:** basta abrir os arquivos `.md`. Os blocos ```` ```mermaid ```` aparecem renderizados.
- **No VS Code:** instale a extensão *Markdown Preview Mermaid Support* e use o preview (`Ctrl/Cmd + Shift + V`).

## Como exportar as imagens (PNG/SVG)

Para inserir os diagramas no documento escrito do TCC (Word/PDF):

1. **Mermaid Live Editor** — acesse [mermaid.live](https://mermaid.live), cole o conteúdo de um bloco `mermaid` e use *Actions → Export* (PNG ou SVG).
2. **VS Code** — com a extensão *Mermaid*, clique com o botão direito no diagrama renderizado e escolha exportar.
3. **PlantUML** (apenas o caso de uso) — cole o bloco `plantuml` em [plantuml.com/plantuml](https://www.plantuml.com/plantuml/uml/) e baixe a imagem.

## Convenções adotadas

- **Idioma:** português, acompanhando o código-fonte (entidades, serviços e endpoints em pt-BR).
- **Notação:** UML 2.x para classes, casos de uso e sequência; notação pé-de-galinha (*crow's foot*) para o modelo entidade-relacionamento.
- **Fidelidade:** todos os diagramas refletem o código em `backend/src/main/java/com/financas`. Ao alterar o código, atualize o diagrama correspondente.
