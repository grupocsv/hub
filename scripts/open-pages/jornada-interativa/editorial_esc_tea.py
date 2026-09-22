"""Revisão editorial explícita, sobre uma base conhecida, antes da camada interativa.

Não contém a página integral, não acessa rede nem publica. Qualquer divergência
na fonte interrompe a transformação; a reversão prova o escopo byte a byte.
"""
import hashlib

BASE_SHA256 = 'f7d272abacf7905a439881e904e4a74e70c882f3d8cca7a5476e01e16ed7d66b'
REVISION = 'esc-tea-100-2026-09-22'
METHODOLOGY_URL = 'https://open.grupocsv.com/esc-tea-100'

REPLACEMENTS = (
    ('svg-pre-cluster', '<text x="965" y="163" text-anchor="middle" font-size="8.5" letter-spacing="1.3" fill="#8fc9ae" font-weight="700">CLUSTER</text>', '<text x="965" y="163" text-anchor="middle" font-size="7.5" letter-spacing="0.4" fill="#8fc9ae" font-weight="700">PRÉ-CLUSTER</text>'),
    ('svg-score', '>3 Fases</text>', '>ESC-TEA-100</text>'),
    ('svg-aad', '>Confirma o Cluster e Conclui a Etapa</text>', '>Revisão médica e confirmação do cluster</text>'),
    ('svg-components', '>Instrumentos da Clusterização · Três Fases Sequenciais</text>', '>Instrumentos para a Pré-clusterização · Três Componentes</text>'),
    ('svg-component-1', '<text x="676" y="464" text-anchor="middle" font-size="9.5" fill="#dbe7b2" font-weight="700">Fase 1</text>', '<text x="676" y="464" text-anchor="middle" font-size="9.5" fill="#dbe7b2" font-weight="700">1</text>'),
    ('svg-component-2', '<text x="908" y="464" text-anchor="middle" font-size="9.5" fill="#dbe7b2" font-weight="700">Fase 2</text>', '<text x="908" y="464" text-anchor="middle" font-size="9.5" fill="#dbe7b2" font-weight="700">2</text>'),
    ('svg-component-3', '<text x="1140" y="464" text-anchor="middle" font-size="9.5" fill="#dbe7b2" font-weight="700">Fase 3</text>', '<text x="1140" y="464" text-anchor="middle" font-size="9.5" fill="#dbe7b2" font-weight="700">3</text>'),
    ('svg-screening', '<text x="646" y="491" font-size="15" font-weight="700" fill="#004e4c">M-CHAT-R</text>', '<text x="646" y="491" font-size="13" font-weight="700" fill="#004e4c">Triagem por faixa etária</text>'),
    ('svg-screening-detail', '>Questionário aos Responsáveis · 20 Itens</text>', '>Instrumento conforme idade e indicação</text>'),
    ('mobile-pre-cluster', '<div class="m-head"><span class="m-num">Clusterização</span><span class="m-tag orq">Cluster 0 · 1 · 2 · 3</span></div>', '<div class="m-head"><span class="m-num">Pré-clusterização · ESC-TEA-100</span><span class="m-tag orq">Cluster 0 · 1 · 2 · 3</span></div>'),
    ('mobile-screening', '<div class="m-item"><span class="k">1</span> <b>M-CHAT-R</b> — Triagem · Risco de TEA</div>', '<div class="m-item"><span class="k">1</span> <b>Triagem por faixa etária</b> — Risco de TEA · Instrumento conforme idade e indicação</div>'),
    ('mobile-aad', '<div class="m-sub">Confirma o Cluster e Conclui a Etapa · 60 Crianças/Mês · 14 por Semana</div>', '<div class="m-sub">Revisão médica e confirmação do cluster · 60 Crianças/Mês · 14 por Semana</div>'),
    ('pediatric-protocol', 'e inclui a aplicação do M-CHAT-R no consultório.', 'e inclui a triagem por faixa etária, conforme a idade, a indicação e o protocolo adotado, no consultório.'),
    ('support-heading', '<div class="h2-eyebrow">Cluster · Três Fases Sequenciais</div>', '<div class="h2-eyebrow">Pré-clusterização · Três Componentes</div>'),
    ('support-description', '<p>Conforme o framework IBRAVS: <strong>M-CHAT-R</strong> faz a triagem, <strong>CARS</strong> gradua a intensidade dos sintomas e <strong>CBDF</strong> classifica funcionalidade, atividade e participação. O AAD confirma o cluster; não o cria do zero.</p>', '<p>A <strong>triagem por faixa etária</strong>, a <strong>CARS</strong> e a <strong>CBDF</strong> compõem a avaliação. O <strong>ESC-TEA-100</strong> reúne seus resultados e apoia a pré-clusterização. No AAD, a avaliação médica considera os instrumentos e o contexto clínico para concluir o diagnóstico e definir o cluster. O escore apoia essa decisão; não a substitui.</p>'),
    ('support-table', '''        <table class="fw">
          <thead><tr><th>Cluster</th><th>M-CHAT-R</th><th>CARS</th><th>CBDF</th></tr></thead>
          <tbody>
            <tr><td class="c">0 · Suspeita</td><td>0 a 2 pts</td><td>≤ 30 pts</td><td>Sem Disfunção</td></tr>
            <tr><td class="c">1 · TEA Nível 1</td><td>3 a 7 pts</td><td>31 a 36 pts</td><td>Leve</td></tr>
            <tr><td class="c">2 · TEA Nível 2</td><td>≥ 8 pts</td><td>≥ 37 pts</td><td>Moderada</td></tr>
            <tr><td class="c">3 · TEA Nível 3</td><td>≥ 8 pts</td><td>≥ 37 pts</td><td>Grave</td></tr>
          </tbody>
        </table>''', '''        <table class="fw">
          <thead><tr><th>Componente</th><th>Contribuição para a avaliação</th></tr></thead>
          <tbody>
            <tr><td class="c">Triagem por faixa etária</td><td>Risco de TEA, com instrumento conforme idade, indicação e protocolo.</td></tr>
            <tr><td class="c">CARS</td><td>Intensidade dos sintomas.</td></tr>
            <tr><td class="c">CBDF</td><td>Funcionalidade, atividade e participação.</td></tr>
          </tbody>
        </table>
        <p>O instrumento de triagem é escolhido conforme a idade, a indicação e o protocolo adotado: M-CHAT-R ou AQ-10. Os alertas de faixa etária e as etapas próprias de aplicação permanecem válidos. A Jornada mantém seu escopo infantil.</p>
        <p><a href="https://open.grupocsv.com/esc-tea-100" target="_blank" rel="noopener">Consultar a metodologia do ESC-TEA-100</a></p>
        <h3>Antes da confirmação do cluster</h3>
        <p><strong>Dados incompletos:</strong> resultado provisório e pendências para avaliação.<br><strong>Fronteira:</strong> conferir os valores antes de concluir.<br><strong>Discordância maior:</strong> revisão clínica antes da alocação.</p>'''),
    ('support-cbdf', '<p>M-CHAT-R e CARS são aplicados ao paciente. A <strong>CBDF</strong> é a Classificação Brasileira de Diagnósticos Fisioterapêuticos — sistema de codificação funcional do COFFITO, fundamentado na CIF da OMS, que o framework trata na mesma seção de CID e DRG. É ela que separa os níveis 2 e 3, quando M-CHAT-R e CARS já não distinguem.</p>', '<p>A <strong>CBDF</strong> é a Classificação Brasileira de Diagnósticos Fisioterapêuticos — sistema de codificação funcional do COFFITO, fundamentado na CIF da OMS. Contribui com a leitura da funcionalidade, da atividade e da participação, em conjunto com os demais instrumentos e o contexto clínico.</p>'),
    ('support-available-assessment', 'O paciente chega ao AAD com os instrumentos aplicados e a pré-clusterização definida.', 'O AAD recebe a avaliação organizada, com os instrumentos disponíveis e as pendências identificadas.'),
    ('support-aad-arrival', 'O paciente chega com os três instrumentos já aplicados.', 'O paciente chega com a avaliação organizada, os instrumentos disponíveis e as pendências identificadas.'),
    ('support-medical-review', '<p>Atividade diagnóstica. Complementa o que faltou, confirma o cluster e conclui a etapa.</p>', '<p>Revisão médica e confirmação do cluster. Complementa as informações necessárias, considera os instrumentos e o contexto clínico para concluir o diagnóstico e definir o cluster. O escore apoia essa decisão; não a substitui.</p>'),
    ('support-methodology-origin', 'etapas 1 a 3, sob especialista líder Dra. Geciely Munaretto.</p>', 'etapas 1 a 3, sob especialista líder Dra. Geciely Munaretto. As regras de conversão do ESC-TEA-100 estão descritas em sua metodologia específica.</p>'),
    ('support-intensity-heading', '<thead><tr><th>Nível</th><th>Razão</th><th>100% · Referência</th><th>75%</th><th>50%</th></tr></thead>', '<thead><tr><th>Cluster</th><th>Razão</th><th>100% · Referência</th><th>75%</th><th>50%</th></tr></thead>'),
    ('support-intensity-review', 'A intensidade decorre do nível confirmado no AAD,', 'A intensidade decorre do cluster confirmado no AAD,'),
    ('support-intensity-1', '<td class="c">TEA 1</td>', '<td class="c">Cluster 1</td>'),
    ('support-intensity-2', '<td class="c">TEA 2</td>', '<td class="c">Cluster 2</td>'),
    ('support-intensity-3', '<td class="c">TEA 3</td>', '<td class="c">Cluster 3</td>'),
    ('support-application', 'Iniciar o nível 3 em 40 horas semanais', 'Iniciar o cluster 3 em 40 horas semanais'),
    ('support-consultations', 'As 4 consultas por nível permanecem', 'As 4 consultas por cluster permanecem'),
)


def sha(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def apply(base):
    if sha(base) != BASE_SHA256:
        raise ValueError('EDITORIAL_SOURCE_CHANGED')
    revised = base
    for name, before, after in REPLACEMENTS:
        if revised.count(before) != 1:
            raise ValueError('EDITORIAL_MATCH_AMBIGUOUS:' + name)
        revised = revised.replace(before, after, 1)
    restored = revised
    for name, before, after in reversed(REPLACEMENTS):
        if restored.count(after) != 1:
            raise ValueError('EDITORIAL_REVERSE_AMBIGUOUS:' + name)
        restored = restored.replace(after, before, 1)
    if restored != base:
        raise ValueError('EDITORIAL_SCOPE_CHANGED')
    return revised, {'revision': REVISION, 'before_sha256': sha(base),
                     'after_sha256': sha(revised),
                     'changes': [name for name, _, _ in REPLACEMENTS],
                     'reversible_byte_for_byte': True}
