# Pasta de Uploads

Esta pasta é usada para receber assets do usuário antes de serem processados e movidos para seus destinos finais.

## Como usar

1. **Faça upload** dos arquivos aqui (via GitHub ou localmente)
2. **Avise o assistente** que os arquivos chegaram
3. **O assistente processa**: renomeia, converte e move para `/public/`

## Estrutura de uploads

```
uploads_usuario/
├── upload_001/          # Primeiro lote de logos
│   ├── tudo/            # Todas as variações de logos
│   └── *.png/webp       # 3 logos para o front-end
├── upload_002/          # Próximo lote (se houver)
└── ...
```

## Destino dos arquivos

| Tipo | Destino Final |
|------|---------------|
| Logos do front-end (3) | `/public/axia-logo.webp`, `/public/medvalor-logo.webp`, `/public/thera-logo.webp` |
| Todas as variações | `/public/logos/` (organizado por empresa) |
| Wallpapers | `/public/wallpapers/` |

## Nomenclatura esperada

Para facilitar o processamento, nomeie os arquivos seguindo o padrão:

```
[empresa]-[orientacao]-[versao]-[cor].png

Exemplos:
- axiacare-vertical-positiva.png
- medvalor-horizontal-negativa-individual.png
- thera-vertical-positiva-grupo.png
```

## Registro de uploads

| ID | Data | Conteúdo | Status |
|----|------|----------|--------|
| upload_001 | 2026-01-24 | Logos das empresas | Aguardando |

---

**Nota:** Esta pasta é ignorada no build do VitePress. Os arquivos aqui são temporários.
