# Padrão de Footer | Entregáveis AxiaCare

Este documento define o footer padrão para todos os entregáveis da consultoria AxiaCare exibidos nos hubs de parceiros (Unihealth GV, Unimed GV) e em ferramentas standalone.

---

## Estrutura

O footer é composto por quatro camadas visuais, nesta ordem:

1. **Logo** -- AxiaCare horizontal positiva (full-color sobre fundo claro)
2. **Slogan** -- "Gestão e Consultoria em Saúde"
3. **Links** -- organizados em três linhas hierárquicas
4. **Copyright** -- linha única com ano, empresa e grupo

---

## Conteúdo Exato

### Logo

Arquivo: `/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png`

Largura: 140px (desktop), 120px (mobile). Centralizada.

### Slogan

```
Gestão e Consultoria em Saúde
```

Sem prefixo "AxView™" ou qualquer outro. O conceito AxView foi descontinuado.

### Links (3 linhas hierárquicas)

```
Linha 1:  Conheça nossas soluções  |  axcare.com.br
Linha 2:  grupocsv.com  |  medvalor.med.br  |  thera.tech
Linha 3:  guithome.com.br  |  LinkedIn  |  Instagram
```

URLs correspondentes:

| Texto | URL | target |
|-------|-----|--------|
| Conheça nossas soluções | https://linktr.ee/gui.thome | (mesmo tab) |
| axcare.com.br | https://www.axcare.com.br | _blank |
| grupocsv.com | https://grupocsv.com | _blank |
| medvalor.med.br | https://www.medvalor.med.br | _blank |
| thera.tech | https://thera.tech | _blank |
| guithome.com.br | https://guithome.com.br | _blank |
| LinkedIn | https://linkedin.com/in/guithome | _blank |
| Instagram | https://www.instagram.com/gui.thome/ | _blank |

### Copyright

```
Copyright © {ANO} AxiaCare | Todos os direitos reservados | Uma empresa do Grupo CSV
```

Atualizar `{ANO}` para o ano corrente a cada virada.

---

## Estilo Visual

| Propriedade | Valor |
|-------------|-------|
| Background | `#f8f5f0` (light) / `var(--vp-c-bg-soft)` (dark) |
| Border-top | 2px solid (cor do parceiro) |
| Border-radius | 16px |
| Padding | 32px 20px (desktop), 24px 16px (mobile) |
| Font links | 13px, cor `#196396` (light) / `#5da9e0` (dark) |
| Separadores | `|` em `#cbd5e1`, 11px |
| Copyright | 11px, `#94a3b8` |
| Slogan | 14px, font-weight 600, `#2d3445` |

---

## Responsividade Mobile

Em viewports abaixo de 480px:

- Logo reduz para 120px
- Slogan reduz para 13px
- Links reduzem para 12px com gap menor
- Padding interno reduz para 24px 16px

Os links usam `flex-wrap: wrap` para quebrar naturalmente em telas estreitas.

---

## HTML de Referência (VitePress)

```html
<div class="page-foot">
  <img class="foot-logo"
       src="/visual-identity/axiacare/logo/png/axiacare_logo_horizontal_full-color_positive.png"
       alt="AxiaCare" />
  <div class="foot-slogan">Gestão e Consultoria em Saúde</div>
  <div class="foot-links">
    <a href="https://linktr.ee/gui.thome">Conheça nossas soluções</a>
    <span class="sep">|</span>
    <a href="https://www.axcare.com.br" target="_blank">axcare.com.br</a>
  </div>
  <div class="foot-links">
    <a href="https://grupocsv.com" target="_blank">grupocsv.com</a>
    <span class="sep">|</span>
    <a href="https://www.medvalor.med.br" target="_blank">medvalor.med.br</a>
    <span class="sep">|</span>
    <a href="https://thera.tech" target="_blank">thera.tech</a>
  </div>
  <div class="foot-links">
    <a href="https://guithome.com.br" target="_blank">guithome.com.br</a>
    <span class="sep">|</span>
    <a href="https://linkedin.com/in/guithome" target="_blank">LinkedIn</a>
    <span class="sep">|</span>
    <a href="https://www.instagram.com/gui.thome/" target="_blank">Instagram</a>
  </div>
  <div class="copyright">Copyright © 2026 AxiaCare | Todos os direitos reservados | Uma empresa do Grupo CSV</div>
</div>
```

---

## Termos Descontinuados

Os seguintes termos **não devem** aparecer em nenhum footer ou entregável:

- "AxView™" (conceito descontinuado)
- "WebApps" (associado ao AxView)
- "GTCorp" (nome anterior do grupo; usar "Grupo CSV")
- Copyright com ano anterior ao corrente

---

## Aplicação

Este footer é obrigatório em:

- Páginas `index.md` dos parceiros (Unihealth GV, Unimed GV)
- Ferramentas HTML standalone entregues aos parceiros
- Qualquer novo entregável da consultoria AxiaCare

Para ferramentas HTML standalone, o footer Grupo CSV (camada externa) e o footer AxiaCare (camada interna) podem coexistir. O footer AxiaCare fica dentro do conteúdo da ferramenta; o footer Grupo CSV fica na camada mais externa do documento.
