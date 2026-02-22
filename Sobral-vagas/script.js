const form = document.getElementById('cvForm');
const submitBtn = document.getElementById('submitBtn');
const telefone = document.getElementById('telefone');
const fileInput = document.getElementById('curriculo');
const fileNameSpan = document.querySelector('.file-name');
const overlay = document.getElementById('overlay');
const loader = document.getElementById('loader');
const modal = document.getElementById('modal');
const modalIcon = document.getElementById('modal-icon');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalClose = document.getElementById('modal-close');

// Máscara de telefone
telefone.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');
  if (v.length > 11) v = v.substring(0,11);
  if (v.length === 11) v = v.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  else if (v.length === 10) v = v.replace(/^(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/^(\d{2})(\d+)/, '($1) $2');
  else v = v.replace(/^(\d{0,2})/, '($1)');
  e.target.value = v;
});

// Nome do arquivo
fileInput.addEventListener('change', () => {
  fileNameSpan.textContent = fileInput.files[0]?.name || 'Nenhum arquivo selecionado';
});

// Fecha modal (clique fora ou no botão)
overlay.addEventListener('click', () => {
  modal.style.display = 'none';
  overlay.style.display = 'none';
});

modalClose.addEventListener('click', () => {
  modal.style.display = 'none';
  overlay.style.display = 'none';
});

// Modal profissional
function showModal(type, title, message) {
  modal.className = 'modal ' + type;

  if (type === 'success') {
    modalIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
    modalIcon.style.color = '#28a745';
    modalClose.style.display = 'block';
  } else if (type === 'error') {
    modalIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    modalIcon.style.color = '#dc3545';
    modalClose.style.display = 'block';
  } else if (type === 'loading') {
    modalIcon.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    modalIcon.style.color = '#c8102e';
    modalClose.style.display = 'none';
  }

  modalTitle.textContent = title;
  modalText.textContent = message;

  modal.style.display = 'flex';
  overlay.style.display = 'block';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Anti-spam honeypot
  if (form.website && form.website.value !== '') return;

  // Validações
  if (!form.nome.value.trim()) { showModal('error', 'Nome obrigatório', 'Informe seu nome completo.'); return; }
  if (!form.telefone.value.trim() || form.telefone.value.length < 14) { showModal('error', 'Telefone inválido', 'Informe um telefone válido com DDD.'); return; }
  if (!form.email.value.trim()) { showModal('error', 'E-mail obrigatório', 'Informe seu e-mail.'); return; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email.value.trim())) { showModal('error', 'E-mail inválido', 'Digite um e-mail válido.'); return; }
  if (!form.vaga.value.trim()) { showModal('error', 'Vaga obrigatória', 'Informe a vaga pretendida.'); return; }

  const file = fileInput.files[0];
  if (!file) { showModal('error', 'Currículo obrigatório', 'Anexe seu currículo em PDF.'); return; }
  if (file.type !== 'application/pdf') { showModal('error', 'Formato inválido', 'Envie apenas arquivos PDF.'); return; }
  if (file.size > 5 * 1024 * 1024) { showModal('error', 'Arquivo muito grande', 'O PDF deve ter no máximo 5MB.'); return; }

  // Loading
  submitBtn.disabled = true;
  showModal('loading', 'Aguardando envio...', 'Processando seu currículo...');

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];

    const payload = new URLSearchParams();
    payload.append('nome', form.nome.value.trim());
    payload.append('telefone', form.telefone.value.trim());
    payload.append('email', form.email.value.trim());
    payload.append('vaga', form.vaga.value.trim());
    payload.append('curriculo', base64);

    try {
      const response = await fetch('https://script.google.com/macros/s/AKfycbwUoB_3fmwtrbCqgyr12NXf_jBMQ0rtPlCorc1Lw0Ni5jYbKq-xwKwNVMRXtnJTkjH0/exec', {
        method: 'POST',
        body: payload
      });

      const text = await response.text();

      if (text.includes('sucesso') || text.includes('✅')) {
        showModal('success', 'Currículo Enviado!', 'Seu currículo foi recebido com sucesso. Nossa equipe analisará em breve.');
        form.reset();
        fileNameSpan.textContent = 'Nenhum arquivo selecionado';
      } else {
        showModal('error', 'Erro ao enviar', text || 'Ocorreu um erro inesperado. Tente novamente.');
      }
    } catch (error) {
      showModal('error', 'Erro de conexão', 'Verifique sua internet e tente novamente.');
    }

    submitBtn.disabled = false;
  };
  reader.readAsDataURL(file);
});