---
title: "Guia AxView — Padrões Definitivos para Projetos Lovable"
version: 3.0.0
owner: "Guilherme"
scope: "Ambientes inteligentes e aplicações desenvolvidas no Lovable para AxiaCare®, MedValor®, Unihealth e Unimed"
last_compiled: 2025-09-13
tags: [AxSets, AxView, AxIntel, VBHC, Lovable, Governança, AxControl]
---

# Sumário executivo

Este guia consolida os padrões de desenvolvimento no **Lovable**, alinhando identidade visual, governança e práticas institucionais para as marcas **AxiaCare®, MedValor®, Unihealth e Unimed**.  
Inspirado no `guia_html.md`, mas adaptado às especificidades do Lovable, ele define fluxos de trabalho, tokens visuais, bibliotecas de componentes e metodologias de integração com GitHub.  

Os objetivos principais são:

- **Padronizar e escalar** a criação de ambientes inteligentes no Lovable.  
- **Garantir consistência visual** (cores, tipografia e layouts mobile-first).  
- **Assegurar governança** (hash SHA-256 + data/hora, nomenclatura, integração GitHub).  
- **Promover modularidade e reuso** com Knowledge Files, prompts institucionais e bibliotecas.  
- **Conectar cada projeto ao AxControl™**, reforçando a cultura de valor em saúde (VBHC).  

---

## 1. Identidade visual

### Paleta de cores (tokens)

| Token               | Hex      | Uso principal |
|---------------------|----------|---------------|
| `--color-primary`   | #196396  | Cabeçalhos, títulos |
| `--color-secondary-1` | #a6d8c0 | Fundos, cartões |
| `--color-secondary-2` | #a6fb90 | Gráficos, detalhes |
| `--color-dark`      | #2d3445  | Texto, ícones |
| `--color-light`     | #f8f5f0  | Fundo geral |
| `--color-white`     | #ffffff  | Áreas neutras |
| `--color-accent`    | #2dbf7f (AxiaCare/Unihealth) / #ff8f00 (MedValor) | Botões, CTAs, chips |

### Tipografia

- **Títulos/subtítulos**: Grifter (42 px / 36 px).  
- **Corpo/tabelas**: fontes de sistema (Inter, Segoe UI, Helvetica), 16–20 px via `clamp()`.  
- **Legendas/observações**: 14 px, itálico.  

### Layout mobile-first

- Grids fluidos, responsividade nativa.  
- Cabeçalho sticky com logotipo + chip (ex.: “Compliance”).  
- Tabelas envoltas em wrappers para scroll horizontal.  
- Uso consistente de cards, chips de status e timelines.  

---

## 2. Biblioteca de componentes Lovable

- **Header institucional**: logo + chip identificador.  
- **Cards**: destaques, módulos de conteúdo.  
- **Chips de status**: compliance, progresso, “draft”.  
- **Tabelas**: preços, indicadores, matrizes (com cabeçalho fixo).  
- **Timeline**: marcos do projeto ou linha do tempo de entregas.  
- **Formulários leves**: `mailto:` e webhooks.  
- **Modais e toasts**: feedback rápido.  
- **Dashboards**: métricas, governança clínica, relatórios executivos.  

---

## 3. Templates completos

- **Centrais de compliance** (`hub.axcare.com.br`).  
- **Políticas institucionais** (privacidade, cookies, anticorrupção).  
- **Propostas comerciais** (`crm.axcare.com.br/{id}`):  
  1. Apresentação  
  2. Impressões iniciais  
  3. Matriz de valor  
  4. Precificação & Timeline  
  5. Vamos ao trabalho  

- **Dashboards institucionais** (Control).  
- **Landing pages educativas** (MedValor).  

---

## 4. Fluxo de desenvolvimento Lovable

1. **Knowledge File**  
   - Registrar visão, personas, tokens, integrações.  

2. **Prompt inicial (Chat Mode)**  
   - Definir público-alvo e restrições.  
   - Exemplo: *“Crie a estrutura da página com cabeçalho sticky e seção de timeline”*.  

3. **Geração de páginas**  
   - Estrutura → cabeçalho → aplicar tokens → inserir seções.  

4. **Edição visual (Visual Edits)**  
   - Ajustes rápidos em textos, cores, espaçamento.  

5. **Código customizado (Code Mode)**  
   - Apenas quando necessário.  
   - Documentar no Knowledge + GitHub.  

6. **Testes e responsividade**  
   - Desktop e mobile.  
   - Tabelas navegáveis, contraste AA.  

7. **Governança**  
   - Gerar hash SHA-256 + data/hora.  
   - Incluir `mailto:` ou webhooks para aprovação.  

---

## 5. Organização e versionamento

### Repositórios GitHub

- **control** → dashboards institucionais.  
- **comercial** → propostas (crm.axcare.com.br).  
- **hub** → centrais de compliance.  

### Nomenclatura

- `comercial/nome-da-empresa-01-25`  
- `control/nome-do-ambiente`  
- `hub/linha-de-cuidado`  

### CI/CD

- Branch principal: `main/master`.  
- Pull requests + GitHub Actions.  
- Documentar no README/CHANGELOG.  

---

## 6. Comandos e DevMode/API

- **gen_lovable** – recebe JSON (`axcontrol`, `axset`, `tipo_template`, `dados`) e gera aplicação base.  
- **assess_lovable** – avalia responsividade, acessibilidade, aderência ao guia.  
- **refine_lovable** – ajusta aplicação conforme requisitos sem alterar dados substantivos.  

---

## 7. Aplicações práticas

- **Control**: dashboards de governança clínica.  
- **Comercial**: propostas escaláveis, CRM integrado.  
- **Hub**: centrais de compliance e documentos institucionais.  
- **MedValor**: landing pages e conteúdos educacionais.  

---

## 8. Riscos e limitações

- Lovable sincroniza apenas a **main branch**.  
- **Code Mode é pago** → prever orçamento.  
- `mailto:` não suporta anexos automáticos.  
- Possível divergência de layout sem tokens padronizados.  

---

## 9. Cultura AxControl™ e governança

- **VBHC no centro**: cada aplicação deve gerar valor mensurável.  
- **Integração total**: soluções se comunicam entre ambientes.  
- **Inovação sustentável**: evitar dependências desnecessárias.  
- **Aprendizado contínuo**: registrar lições, atualizar componentes.  

---

**Conclusão:**  
O `guia_lovable.md` versão **3.0.0** é o **Documento Mestre para Lovable**, equivalente ao `guia_html.md`. Ele garante consistência visual, governança, modularidade e integração completa com GitHub, reforçando a cultura AxControl™ e os princípios VBHC.  
Use-o como referência definitiva para o GPT Custom **AxIntel™ | Lovable AxView™**, para DevMode e para automações via API.  
