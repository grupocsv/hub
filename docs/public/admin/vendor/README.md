# Biblioteca do QR Code

O Admin usa **qrcode-generator 1.4.4**, de Kazuhiko Arase, sob licença **MIT**, sem dependências de execução e sem consulta a CDN.

- Origem: https://registry.npmjs.org/qrcode-generator/-/qrcode-generator-1.4.4.tgz
- Metadados: https://registry.npmjs.org/qrcode-generator/1.4.4
- Arquivo original: `package/qrcode.js`, copiado integralmente como `qrcode-generator-1.4.4.js`.
- A integridade SHA-512 do arquivo compactado foi conferida contra `dist.integrity` do registro npm.
- O pacote declara a licença MIT em `package.json` e no cabeçalho do código, sem arquivo de licença separado. `qrcode-generator-LICENSE` reproduz o texto integral da licença e a atribuição do cabeçalho.

| Arquivo | SHA-256 |
|---|---|
| Pacote npm original | `ab6ed47d378877441deae95972e07b2716c26545a735a23aa6b9d442b33026ed` |
| `qrcode-generator-1.4.4.js` | `18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780` |
| `qrcode-generator-LICENSE` | `3a850fa5f08101db6f40676c2786e10bd2cd5fff7b12ffdf1e0c434d4e49d90c` |

A API global é `qrcode(0, 'M')`. Depois de `addData(enderecoPublico)` e `make()`, `getModuleCount()` e `isDark(linha, coluna)` fornecem a matriz para PNG em canvas; `createSvgTag()` gera o SVG. O conteúdo deve ser sempre `https://csv.online/<nome>`. A função `createDataURL()` desta versão produz GIF e não deve ser usada para o download PNG.

O espelho em `docs/public/admin/vendor/` é necessário para que o build isolado do VitePress sirva o Admin e sua biblioteca no mesmo caminho, inclusive antes da cópia adicional de `admin/` feita pelo workflow. Os arquivos de ambos os diretórios devem continuar idênticos; o teste estático verifica essa igualdade.
