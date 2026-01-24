window.addEventListener('DOMContentLoaded', () => {
  // 1) Pre‑popular data com a data atual
  const dataField = document.getElementById('dataAvaliacao');
  if (dataField && !dataField.value) {
    dataField.value = new Date().toISOString().slice(0, 10);
  }

  // 2) Função utilitária para capturar blocos por aria-describedby
  function getValuesById(descritor) {
    const section = document.querySelectorAll(`textarea[aria-describedby="${descritor}"]`);
    return Array.from(section).map(el => el.value.trim());
  }

  // 3) Ação ao clicar no botão
  const button = document.querySelector('#emailRadar');
  if (!button) return;

  button.addEventListener('click', () => {
    // 3.1) Validação de campos obrigatórios
    const requiredFields = [
      { el: dataField, name: 'Data da Avaliação' },
      { el: document.getElementById('equipe'), name: 'Equipe' },
      { el: document.getElementById('avaliador'), name: 'Avaliador' },
    ];
    for (const field of requiredFields) {
      if (!field.el.value.trim()) {
        alert(`Por favor, preencha o campo: ${field.name}.`);
        field.el.focus();
        return;
      }
    }

    // 3.2) Montagem do payload
    const payload = {
      nomeFormulario: 'RADAR',
      data: dataField.value,
      equipe: document.getElementById('equipe').value.trim(),
      avaliador: document.getElementById('avaliador').value.trim(),
      periodicidade: document.getElementById('periodicidade').value.trim(),
      blocos: {
        relatos: getValuesById('titulo-relatos'),
        abertos: getValuesById('titulo-abertos'),
        direcionadores: getValuesById('titulo-direcionadores'),
        agenda: getValuesById('titulo-agenda'),
        riscos: getValuesById('titulo-riscos'),
        registros: getValuesById('titulo-registros'),
        acoes: getValuesById('titulo-acoes'),
        definicoes: getValuesById('titulo-definicoes'),
        alinhamentos: getValuesById('titulo-alinhamentos'),
        recomendacoes: getValuesById('titulo-recomendacoes'),
      }
    };

    // 3.3) Disparo do Webhook para o Make
    fetch('https://hook.us2.make.com/z6mocqz18ikge52aeg88u7k90r3pekyr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (response.ok) {
        alert('Avaliação enviada com sucesso à IA (RADAR³).');
      } else {
        alert('Erro no envio. Verifique sua conexão ou tente novamente.');
      }
    })
    .catch(() => {
      alert('Erro técnico ao enviar dados para o servidor.');
    });
  });
});
