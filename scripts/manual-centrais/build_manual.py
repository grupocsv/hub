"""Diagramação editorial do manual humano das Centrais e da busca Panta v2."""
from pathlib import Path
import argparse
import json
import os

ROOT = Path(__file__).resolve().parents[2]
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Flowable
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
from pypdf import PdfReader

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", type=Path, default=ROOT / "output/pdf/manual-centrais-documentos.pdf")
parser.add_argument("--font-family", choices=("auto", "segoe", "liberation"), default="auto")
args = parser.parse_args()
ASSETS = ROOT / "docs/public/manuais/documentos"
OUT = args.output.resolve()
OUT.parent.mkdir(parents=True, exist_ok=True)
BLUE = colors.HexColor("#196396")
GREEN = colors.HexColor("#2DBF7F")
DARK = colors.HexColor("#1B1E24")
LIGHT = colors.HexColor("#F4F6F8")
MUTED = colors.HexColor("#4A5260")
LINE = colors.HexColor("#D8E1E7")
W, H = A4
CW = W - 100

windows_fonts = Path(os.environ.get("SystemRoot", "C:/Windows")) / "Fonts"
use_segoe = args.font_family == "segoe" or (args.font_family == "auto" and (windows_fonts / "segoeui.ttf").is_file())
font_paths = [windows_fonts / name for name in ("segoeui.ttf", "segoeuib.ttf", "segoeuii.ttf")] if use_segoe else [
    ROOT / "docs/public/documentos/vendor/pdfjs/standard_fonts" / name
    for name in ("LiberationSans-Regular.ttf", "LiberationSans-Bold.ttf", "LiberationSans-Italic.ttf")
]
for font_name, font_path in zip(("Body", "BodyBold", "BodyItalic"), font_paths):
    if not font_path.is_file():
        raise SystemExit(f"Fonte ausente: {font_path}. Use --font-family liberation.")
    pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
pdfmetrics.registerFontFamily("Body", normal="Body", bold="BodyBold", italic="BodyItalic", boldItalic="BodyBold")
TITLE_FONT = "BodyBold"
try:
    pdfmetrics.registerFont(TTFont("Grifter", str(ROOT / "docs/public/visual-identity/_brand-guidelines/grupo-csv_font_grifter-bold.otf")))
    TITLE_FONT = "Grifter"
except Exception:
    pass

STYLES = {
    "body": ParagraphStyle("body", fontName="Body", fontSize=10.8, leading=15.2, textColor=DARK, spaceAfter=9, allowWidows=0, allowOrphans=0),
    "small": ParagraphStyle("small", fontName="Body", fontSize=9, leading=12.5, textColor=MUTED, spaceAfter=8, allowWidows=0, allowOrphans=0),
    "lead": ParagraphStyle("lead", fontName="Body", fontSize=13, leading=18.5, textColor=DARK, spaceAfter=18),
    "h1": ParagraphStyle("h1", fontName=TITLE_FONT, fontSize=24, leading=29, textColor=BLUE, spaceAfter=16, keepWithNext=True),
    "h2": ParagraphStyle("h2", fontName="BodyBold", fontSize=14, leading=19, textColor=DARK, spaceBefore=10, spaceAfter=9, keepWithNext=True),
    "table": ParagraphStyle("table", fontName="Body", fontSize=9.3, leading=13, textColor=DARK),
    "tablehead": ParagraphStyle("tablehead", fontName="BodyBold", fontSize=9.3, leading=13, textColor=colors.white),
    "callout": ParagraphStyle("callout", fontName="BodyBold", fontSize=11, leading=15.5, textColor=BLUE),
    "stepnum": ParagraphStyle("stepnum", fontName="BodyBold", fontSize=11, leading=15, textColor=BLUE),
}


def P(text, style="body"):
    return Paragraph(text.replace("—", "-").replace("–", "-"), STYLES[style])


def head(text):
    return P(text, "h1")


def sub(text):
    return P(text, "h2")


def note(text):
    t = Table([[P(text, "callout")]], colWidths=[CW])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E8F2F8")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 13),
        ("RIGHTPADDING", (0, 0), (-1, -1), 13),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))
    return [t, Spacer(1, 13)]


def table(headers, rows, widths):
    data = [[P(str(x), "tablehead") for x in headers]]
    data += [[P(str(x), "table") for x in row] for row in rows]
    t = Table(data, colWidths=[CW * x for x in widths], hAlign="LEFT", repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LINEBELOW", (0, 0), (-1, -1), .4, LINE),
    ]))
    return [t, Spacer(1, 13)]


def steps(items):
    result = []
    for number, text in enumerate(items, 1):
        t = Table([[P(f"{number:02}", "stepnum"), P(text)]], colWidths=[30, CW - 30])
        t.setStyle(TableStyle([("VALIGN", (0,0),(-1,-1),"TOP"),("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),3),("TOPPADDING",(0,0),(-1,-1),1),("BOTTOMPADDING",(0,0),(-1,-1),4)]))
        result.append(t)
    return result


class Diagram(Flowable):
    def __init__(self, filename, width=CW):
        super().__init__()
        self.drawing = svg2rlg(str(ASSETS / filename))
        self.scale = width / self.drawing.width
        self.width = width
        self.height = self.drawing.height * self.scale

    def draw(self):
        self.canv.saveState()
        self.canv.scale(self.scale, self.scale)
        renderPDF.draw(self.drawing, self.canv, 0, 0)
        self.canv.restoreState()


def diagram(name):
    return [Diagram(name), Spacer(1, 16)]


def link(label, url):
    return f'<link href="{url}" color="#196396"><u>{label}</u></link>'


LOGO = Path(__file__).resolve().parent / "assets/csv-horizontal-negativo-sf.png"


def draw_page(c, doc):
    if doc.page == 1:
        c.setFillColor(DARK)
        c.rect(0, 0, W, H, fill=1, stroke=0)
        c.setFillColor(BLUE)
        c.rect(0, 0, 18, H, fill=1, stroke=0)
        image = ImageReader(str(LOGO))
        iw, ih = image.getSize()
        c.drawImage(image, 50, H - 128, width=175, height=175 * ih / iw, mask="auto")
        c.setFillColor(GREEN)
        c.rect(50, H - 212, 70, 4, fill=1, stroke=0)
        c.setFillColor(colors.white)
        c.setFont(TITLE_FONT, 34)
        c.drawString(50, H - 272, "Centrais de")
        c.drawString(50, H - 318, "Documentos")
        c.setFont("Body", 19)
        c.drawString(50, H - 357, "Manual de uso e integração")
        c.setFont("Body", 12)
        c.setFillColor(colors.HexColor("#D6E1E8"))
        for i, line in enumerate([
            "Grupo CSV | Unimed Governador Valadares",
            "Unihealth | ICDS | 2iM",
        ]):
            c.drawString(50, H - 417 - i * 21, line)
        c.setFillColor(colors.white)
        c.setFont("BodyBold", 14)
        c.drawString(50, 230, "Um acervo para cada organização.")
        c.drawString(50, 208, "Um modo simples de trabalhar.")
        c.setFont("Body", 10.5)
        c.setFillColor(colors.HexColor("#B4C1CB"))
        c.drawString(50, 128, "Inclui versões, tags, links e a relação com o Panta v2.")
        c.drawString(50, 68, "Edição de 1º de novembro de 2026")
        c.drawString(50, 50, "Grupo CSV - Cuidados em Saúde com Valor")
        return
    c.setFillColor(LIGHT)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(BLUE)
    c.setFont("BodyBold", 8.5)
    c.drawString(50, H - 33, "CENTRAIS DE DOCUMENTOS")
    c.setFillColor(MUTED)
    c.setFont("Body", 8.5)
    c.drawRightString(W - 50, H - 33, "Grupo CSV")
    c.setStrokeColor(LINE)
    c.line(50, 44, W - 50, 44)
    c.setFont("Body", 8)
    c.drawString(50, 29, "Manual de uso | 01/11/2026")
    c.drawRightString(W - 50, 29, f"{doc.page:02} / 16")


pages = []
pages.append([Spacer(1, 1)])

pages.append([
    head("Como usar este manual"),
    P("Comece pela Central da organização. Depois, siga a tarefa que deseja realizar. Os procedimentos são compartilhados; os documentos e as permissões não.", "lead"),
    *table(["Tema", "Página"], [
        ("Grupo CSV e Unimed Governador Valadares", "03"),
        ("Unihealth, ICDS e 2iM", "04"),
        ("O que é igual entre as Centrais", "05"),
        ("Tela, consulta e favoritos", "06"),
        ("Enviar um documento novo", "07"),
        ("Atualizar no mesmo cartão e consultar versões", "08"),
        ("Coleções, tags e classificação", "09"),
        ("Link interno ou link público", "10"),
        ("Administrar links, arquivar e excluir", "11"),
        ("Trazer uma pasta do computador", "12"),
        ("Pedir tarefas a agentes", "13"),
        ("Central, Panta e VPS", "14"),
        ("Pesquisar com o Panta v2", "15"),
        ("Dúvidas frequentes e referências", "16"),
    ], [.88, .12]),
    *note("Em uma frase: a Central guarda e organiza; o Panta v2 ajuda a encontrar. Não é necessário enviar uma segunda cópia para o Panta."),
    P("As ilustrações são diagramas explicativos, sem documentos reais. Os exemplos de organização não representam um inventário dos arquivos já cadastrados.", "small"),
])

pages.append([
    head("A Central certa: grupo e operadora"),
    P("Tenant é o nome técnico do acervo separado de uma organização. Você usa a mesma aplicação, mas muda o contexto documental.", "lead"),
    sub("Grupo CSV | acervo corporativo"),
    P("Destina-se aos documentos corporativos do Grupo CSV. Pode organizar manuais internos, referências institucionais e documentos comuns à operação do grupo, conforme a autorização de acesso."),
    P("Um documento de cliente não deve ir para este acervo apenas porque foi produzido por uma pessoa do Grupo CSV. O destino depende da organização responsável e do público autorizado."),
    P(link("Abrir Central do Grupo CSV", "https://hub.grupocsv.com/documentos/?portal=grupo-csv")),
    P("Identificador para agentes: <b>grupo-csv</b>.", "small"),
    sub("Unimed Governador Valadares | operadora"),
    P("É o acervo da Unimed Governador Valadares. O EVS - Escritório de Valor em Saúde - vinculado à operadora está nesse contexto institucional. Documentos de gestão, protocolos e entregáveis autorizados podem ser organizados nesse espaço."),
    P("Esse acervo não é o acervo do hospital Unihealth. Pessoas em comum ou nomes semelhantes não tornam as duas organizações o mesmo destino."),
    P(link("Abrir Central da Unimed Governador Valadares", "https://hub.grupocsv.com/documentos/?portal=unimed")),
    P("Identificador para agentes: <b>unimed</b>.", "small"),
    *note("Antes de enviar ou compartilhar, confira a logomarca e a organização identificada na página. O endereço seleciona a Central; o servidor confirma se você tem acesso."),
])

pages.append([
    head("A Central certa: hospital e parceiros"),
    sub("Unihealth | hospital gerido pelo ICDS"),
    P("Separa os documentos do contexto hospitalar dos documentos da operadora e dos documentos institucionais próprios do ICDS. Exemplos possíveis: procedimentos operacionais do hospital e entregáveis hospitalares autorizados."),
    P("A presença de dados pessoais ou clínicos exige classificação e permissões adequadas. Este manual não autoriza a inclusão desses dados."),
    P(link("Abrir Central da Unihealth", "https://hub.grupocsv.com/documentos/?portal=unihealth") + " | Identificador: <b>unihealth</b>."),
    sub("ICDS | acervo institucional"),
    P("O Instituto de Cooperação para o Desenvolvimento da Saúde tem seu próprio acervo. Ele não é uma pasta que abre automaticamente todos os documentos da Unihealth."),
    P("Um documento institucional do ICDS e um documento operacional do hospital podem ter destinos diferentes. Não crie cópias nos dois acervos apenas para resolver uma dúvida de organização."),
    P(link("Abrir Central do ICDS", "https://hub.grupocsv.com/documentos/?portal=icds") + " | Identificador: <b>icds</b>."),
    sub("2iM | acervo da parceria"),
    P("Reúne documentos autorizados da relação com a 2iM, como entregáveis, referências e documentos de projeto. O acesso permanece vinculado à organização, ao usuário e às permissões do documento."),
    P(link("Abrir Central da 2iM", "https://hub.grupocsv.com/documentos/?portal=2im") + " | Identificador: <b>2im</b>."),
    *note("Se uma pasta mistura organizações, defina o destino por documento antes de importar. O nome da pasta não prova, sozinho, a titularidade ou a permissão."),
])

pages.append([
    head("O que é igual entre as Centrais"),
    *diagram("centrais-tenants.svg"),
    P("As cinco Centrais usam o mesmo módulo e a mesma configuração de funcionalidades: catálogo, coleções, tags, versões, visualizador, favoritos e busca. Links públicos e exclusões usam o mesmo sistema, respeitando o papel de cada pessoa."),
    *table(["Compartilhado", "Separado por organização"], [
        ("Aplicação e modo de usar", "Documentos e versões"),
        ("Controles e fluxos de trabalho", "Coleções e tags"),
        ("Recursos de busca e consulta", "Permissões, vínculos e restrições"),
        ("Regras de segurança", "Links administrados em cada acervo"),
    ], [.5, .5]),
    *note("Mesma funcionalidade não significa mesma permissão. Um botão ausente pode refletir seu papel, uma restrição do documento ou o processamento ainda não concluído."),
    P("Esta equivalência descreve a aplicação e sua configuração. Não significa que cada arquivo tenha sido verificado individualmente nem concede acesso cruzado entre organizações.", "small"),
])

pages.append([
    head("Consultar, abrir e favoritar"),
    *table(["Controle", "Para que serve"], [
        ("Documentos", "Voltar ao catálogo da Central selecionada."),
        ("Coleções", "Abrir os agrupamentos existentes e seus documentos."),
        ("Favoritos", "Rever os documentos marcados com a estrela."),
        ("Recentes", "Retomar itens carregados nesta sessão, pela atualização do documento; não é um histórico permanente dos cliques."),
        ("Links Públicos / Exclusões", "Administrar compartilhamento e pedidos, conforme permissão."),
    ], [.27, .73]),
    *steps([
        "Use <b>Coleção, Tag, Classificação e Disponibilidade</b>; depois clique em <b>Aplicar Filtros</b>. <b>Limpar</b> reinicia os filtros; <b>Carregar Mais</b> traz a próxima página.",
        "No cartão, confira o título e o formato real do arquivo. Clique em <b>Ver Detalhes</b> e depois em <b>Abrir Documento</b>.",
        "No PDF, avance e volte pelas páginas. Use <b>Baixar Arquivo</b> se permitido. <b>Fechar</b> retorna ao catálogo.",
        "Clique na estrela vazia para favoritar; clique na preenchida para remover. O favorito não cria cópia, não compartilha e não muda permissões.",
    ]),
    *note("Disponibilidade substitui a antiga escolha visível entre rascunho e ativo. Arquivamento, exclusão, verificação e falhas continuam sendo situações reais que precisam aparecer."),
])

pages.append([
    head("Enviar um documento novo"),
    P("Procure o documento antes de enviar. Se você está atualizando algo que já existe, use o caminho de nova versão, explicado na próxima página."),
    *diagram("ciclo-documental.svg"),
    *steps([
        "Confira a Central e clique em <b>Enviar Documento</b>. Preencha título, descrição útil e coleção, quando aplicável.",
        "Escolha classificação e política de indexação. <b>Somente Metadados</b> é o padrão; texto completo inclui o texto extraído autorizado.",
        "Selecione o arquivo e envie. Aguarde a verificação. Para quem já pode disponibilizar versões, a interface solicita essa etapa automaticamente; o servidor revalida as condições.",
    ]),
    *table(["Aceitos", "Limites e cuidados"], [
        ("PDF, PNG, JPG/JPEG, WEBP, TXT, MD", "Até 50 MiB no formulário; até 8 MiB decodificados no transporte MCP."),
        ("XLSX e DOCX: não aceitos diretamente", "Não troque a extensão. Conversão em PDF exige decisão explícita e preservação do original."),
    ], [.45, .55]),
    P("A intenção de disponibilização automática sobrevive ao fechamento da aba. Quem só pode enviar ainda depende de uma pessoa autorizada. Falha ou demora não justifica criar outro cartão.", "small"),
])

pages.append([
    head("Um cartão, várias versões"),
    *diagram("documento-versoes.svg"),
    *steps([
        "Abra o documento existente e escolha <b>Enviar Nova Versão</b>. Não crie outro registro apenas para atualizar o arquivo.",
        "Aguarde o processamento e confira a versão atual no <b>Histórico de Versões</b>.",
        "Use <b>Localizar versão</b> para filtrar por número, nome do arquivo ou data. <b>Abrir esta versão</b> abre a revisão escolhida; o download fica no visualizador.",
    ]),
    P("Sem versão atual, o documento pode aparecer como <b>Aguardando disponibilização</b>. Em um envio antigo já verificado, uma pessoa autorizada pode usar <b>Usar como versão atual</b>. A ação não remove o histórico nem libera um arquivo reprovado."),
    *note("Histórico não é busca no conteúdo antigo. O Panta pesquisa a versão vigente. Para ler uma versão anterior, localize-a no histórico e abra seu arquivo."),
    P("Cópia idêntica pode ser detectada pelo hash dos bytes. Nome parecido não prova que dois arquivos sejam versões do mesmo documento.", "small"),
])

pages.append([
    head("Organizar sem complicar"),
    sub("Coleções e tags"),
    P("A coleção agrupa documentos de um projeto ou assunto. A tag acrescenta uma palavra-chave que pode aparecer em diferentes agrupamentos. Exemplo: coleção <b>Manuais de operação</b>; tags <b>atendimento</b> e <b>revisao-anual</b>."),
    *steps([
        "Em <b>Ver Detalhes</b>, localize <b>Tags</b>. A edição aparece para quem possui a permissão correspondente.",
        "Informe nomes separados por vírgula: até <b>20 tags</b>, com até <b>120 caracteres</b> por nome. Evite dados pessoais desnecessários.",
        "Clique em <b>Salvar Tags</b>. A lista informada substitui o conjunto do documento; apagar um nome retira esse vínculo. Confira o resultado e use o filtro Tag no catálogo.",
    ]),
    sub("Classificação e pesquisa são decisões diferentes"),
    *table(["Campo", "O que significa"], [
        ("Classificação", "Identifica o tratamento de acesso: Público, Interno, Restrito ou Confidencial. Não cria acesso anônimo."),
        ("Somente Metadados", "Pesquisa título, descrição e demais metadados permitidos; não pesquisa o corpo."),
        ("Texto completo e metadados", "Permite pesquisar o texto extraído autorizado da versão vigente."),
        ("Indexação desabilitada", "O documento continua no catálogo autorizado, mas não participa da busca do Panta."),
    ], [.33, .67]),
    *note("Usar a mesma tag em duas Centrais não conecta seus acervos nem amplia o acesso. As tags também pertencem ao contexto da organização."),
])

pages.append([
    head("Escolher o tipo de link"),
    *diagram("links-internos-publicos.svg"),
    *table(["", "Interno", "Público"], [
        ("Destinatário", "Pessoa com login e permissão", "Qualquer pessoa que tenha o endereço válido"),
        ("Como obter", "Abra o visualizador e copie a URL da barra do navegador", "Crie explicitamente em Links Públicos"),
        ("Versão", "Confira se a URL fixa uma versão", "Fica vinculada à versão escolhida na criação"),
        ("Revogação", "Acesso sujeito às permissões e ao estado do documento", "Inativação, expiração ou retirada do documento de uso"),
    ], [.2, .4, .4]),
    *note("Uma URL interna não concede acesso. Uma classificação Público não cria uma URL anônima. São controles diferentes."),
    P("Links públicos de documentos não são Open Pages: o arquivo continua no armazenamento privado e a entrega é mediada pela API da Central.", "small"),
])

pages.append([
    head("Compartilhar e retirar de uso"),
    sub("Criar e administrar um link público"),
    *steps([
        "Em <b>Ver Detalhes</b>, abra <b>Compartilhamento Externo / Links Públicos</b> e clique em <b>Criar Link</b>.",
        "Informe um endereço curto disponível, como <b>manual-atendimento</b>: de 3 a 48 caracteres, com letras minúsculas sem acentos, números e hífens simples. O nome é único no serviço.",
        "Se necessário, defina expiração e <b>Forçar download ao abrir</b>. Confirme e copie a URL devolvida pela aplicação.",
        "No menu <b>Links Públicos</b>, consulte os links da Central e use <b>Inativar</b> ou <b>Ativar</b>. Confira também a expiração.",
    ]),
    P("Restritos e Confidenciais não admitem link público. Uma nova versão não muda o conteúdo de um link já criado. Inativar interrompe novos acessos, mas não apaga cópias já baixadas."),
    sub("Arquivar ou excluir"),
    *table(["Objetivo", "Ação"], [
        ("Retirar com possibilidade de retorno", "Arquivar; depois Restaurar, quando cabível."),
        ("Solicitar retirada por exclusão", "Solicitar Exclusão e informar o motivo."),
        ("Decidir o pedido", "Exclusões / Aprovar Exclusão Lógica, Rejeitar ou Cancelar, conforme o papel e o estado."),
    ], [.43, .57]),
    *note("Exclusão é lógica: o documento sai de uso, mas os bytes e as versões são preservados conforme a retenção. Restaurar um arquivado não desfaz uma exclusão já aprovada."),
    P("Arquivar ou solicitar exclusão inativa os links. Restaurar, rejeitar ou cancelar não os reativa automaticamente.", "small"),
])

pages.append([
    head("Trazer uma pasta do computador"),
    P("Informe o caminho completo da pasta e a Central de destino. Não é preciso anexar arquivo por arquivo. Se estiver apenas no Drive, informe a URL da pasta e a conta pertinente.", "lead"),
    *steps([
        "Inventariar arquivos e subpastas, preservando os originais. Identificar arquivos ilegíveis, atalhos e formatos não suportados.",
        "Comparar bytes para cópias idênticas e analisar conteúdo e contexto para possíveis versões. O nome, sozinho, não decide.",
        "Comparar com a Central e propor, para cada item: ignorar duplicata, criar documento, adicionar versão ou revisar a correspondência.",
        "Propor título, descrição, coleção, tags, classificação e indexação. Aprovar um lote definido antes do envio, quando o pedido ainda for só de análise.",
        "Enviar o lote autorizado e conferir os resultados. Cada atualização mantém o documento e seu histórico; pendências devem ser relatadas, não escondidas.",
    ]),
    sub("Um pedido pronto para adaptar"),
    *note("Analise a pasta [caminho completo], incluindo subpastas, para a Central da Unimed Governador Valadares (tenant unimed). Preserve os originais. Identifique duplicatas, possíveis versões e correspondências com o acervo. Proponha a organização e informe formatos não suportados. Nesta etapa, não envie, não exclua e não crie links públicos."),
    P("Importação não é sincronização contínua. Arquivos criados ou alterados depois precisam de nova integração. Uma representação PDF de planilha não conserva as fórmulas e a edição do XLSX.", "small"),
])

pages.append([
    head("Pedir tarefas a agentes"),
    P("O pedido pode ser simples. A execução deve manter o acervo correto, os identificadores, as permissões e o histórico.", "lead"),
    *table(["Você pode pedir", "O agente deve fazer"], [
        ("Localize o manual na Central da Unimed GV", "Pesquisar no tenant unimed, conferir o documento e informar a versão usada."),
        ("Atualize este documento com o arquivo anexo", "Usar o mesmo document_id e criar uma nova versão, sem outro cartão."),
        ("Analise esta pasta; não envie ainda", "Inventariar, detectar duplicatas, propor organização e aguardar o lote autorizado."),
        ("Crie um link público desta versão", "Confirmar conteúdo, versão, endereço e validade definidos; criar somente o compartilhamento autorizado."),
    ], [.46, .54]),
    sub("Integração com a mesma Central"),
    P("As ferramentas documentais são <b>documents_list, documents_get, documents_publish, documents_status, documents_download, documents_manage, documents_search, documents_public_links</b> e <b>documents_deletion_requests</b>. Usam credencial de serviço; não devem reutilizar sua sessão pessoal."),
    P("O nome publish não significa que todo o fluxo terminou. O agente deve acompanhar o processamento e confirmar a disponibilização. O conector atual pode exigir a promoção explícita da versão, mesmo quando a interface já automatiza essa etapa."),
    *note("Produzir um arquivo não autoriza enviá-lo. Quando a inclusão na Central ainda não foi decidida, o agente deve oferecer essa possibilidade de forma contextual. Uma aprovação clara de lote não precisa ser repetida arquivo a arquivo."),
    P(link("Abrir o guia técnico para agentes", "https://hub.grupocsv.com/_infra/manuais/central-documentos-agentes")),
])

pages.append([
    head("Central, Panta e VPS"),
    *diagram("panta-central-vps.svg"),
    *table(["Componente", "Papel"], [
        ("Central", "Guarda e organiza arquivos, versões, acesso, links e exclusões."),
        ("R2 privado / D1", "R2 guarda originais e derivados; D1 guarda catálogo, permissões e referências das versões."),
        ("Panta v2 documental", "Mantém um índice derivado na VPS para pesquisar o conteúdo autorizado."),
        ("Panta v1 federado", "Serviço anterior de busca entre fontes e relações. Não foi integralmente substituído pela v2 documental."),
    ], [.32, .68]),
    *note("Você não precisa copiar arquivos manualmente para a VPS. Use a Central ou a integração autorizada. Uma falha na busca não apaga os originais nem muda as permissões."),
])

pages.append([
    head("Pesquisar com o Panta v2"),
    *steps([
        "Confira a organização e digite termos específicos em <b>Buscar Documentos</b>, por exemplo <b>protocolo atendimento</b>.",
        "Leia título e trecho do resultado. A referência identifica documento e versão. Um trecho não substitui a leitura do arquivo.",
        "Use <b>Ver Detalhes</b> e <b>Abrir Documento</b> para conferir a fonte. <b>Voltar ao Catálogo</b> encerra a pesquisa.",
    ]),
    *table(["Limite atual", "Como interpretar"], [
        ("Pesquisa textual", "Não é chat, resumo automático nem busca semântica com equivalência garantida entre sinônimos."),
        ("Versão vigente", "O corpo das versões antigas não integra a busca atual. Use o histórico."),
        ("Política de indexação", "Somente Metadados não pesquisa o corpo; texto completo depende de extração válida; Desabilitada deixa o documento fora do índice."),
        ("Até 20 trechos na tela", "Um documento pode produzir mais de um trecho. Não significa 20 documentos distintos ou cobertura completa."),
        ("Escopo de até 500 documentos autorizados", "Acima disso, a API recusa a busca explicitamente. Não é o limite de armazenamento da Central."),
        ("Atualização assíncrona", "Salvar e aparecer na busca não são simultâneos. A sincronização usa a revisão atual; fila e tentativas podem acrescentar demora."),
    ], [.35, .65]),
    P("Filtros de catálogo não reduzem automaticamente o escopo da busca textual. Se o serviço estiver indisponível, volte ao catálogo. A presença de um PDF ou imagem não garante que todo o conteúdo visual tenha texto extraído ou OCR.", "small"),
])

pages.append([
    head("Dúvidas frequentes e referências"),
    *table(["Situação", "Primeira conferência"], [
        ("Não encontro o arquivo", "Central, filtros, permissão, disponibilidade e política de indexação."),
        ("Enviei, mas não ficou disponível", "Resultado do processamento, segurança e autorização. Não crie outro cartão."),
        ("Falta um botão", "Papel na Central, restrição do documento ou processamento pendente."),
        ("Preciso da versão anterior", "Histórico de Versões, Localizar versão e Abrir esta versão."),
        ("O link público mostra conteúdo antigo", "O vínculo é fixo na versão escolhida; atualização não troca o link automaticamente."),
        ("O documento mudou durante minha edição", "Recarregue os detalhes antes de repetir; preserve a mudança concorrente."),
        ("Quero enviar XLSX ou DOCX", "Formato não suportado diretamente. Preserve o original e avalie representação de leitura autorizada."),
    ], [.41, .59]),
    sub("Antes de concluir uma tarefa"),
    P("Confira a organização, o documento, a versão, a permissão e o resultado real. Se houver compartilhamento público, confira também o endereço e a validade. Informe o que ficou pendente."),
    sub("Guias e contratos"),
    P(link("Manual HTML das Centrais", "https://hub.grupocsv.com/_infra/manuais/central-documentos")),
    P(link("Manual HTML do Panta v2", "https://hub.grupocsv.com/_infra/manuais/panta-v2")),
    P(link("Guia técnico para agentes", "https://hub.grupocsv.com/_infra/manuais/central-documentos-agentes")),
    P(link("Arquitetura e operação", "https://hub.grupocsv.com/_infra/central-documentos") + " | " + link("Contrato OpenAPI", "https://documentos-api.grupocsv.com/docs/openapi.json")),
    P("Fontes: implementação compartilhada do Hub, API documental e manuais HTML correspondentes. Edição de 01/11/2026. Este guia explica o produto e suas limitações; não atesta individualmente todos os documentos nem concede acesso.", "small"),
])

story = []
for index, page in enumerate(pages):
    if index:
        story.append(PageBreak())
    story.extend(page)

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=50, leftMargin=50, topMargin=65, bottomMargin=61,
                        title="Manual das Centrais de Documentos e do Panta v2", author="Grupo CSV - Cuidados em Saúde com Valor", subject="Guia humano das Centrais, versões, compartilhamento e busca documental")
doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)
reader = PdfReader(str(OUT))
report = {"path": str(OUT), "pages": len(reader.pages), "page_text_lengths": [len(p.extract_text() or "") for p in reader.pages], "bytes": OUT.stat().st_size}
print(json.dumps(report, ensure_ascii=False))
if len(reader.pages) != 16:
    raise SystemExit("Paginação inesperada: revisar antes da entrega")
