/**
 * Carrossel de depoimentos
 * -------------------------------------------------
 * Componente acessível e sem dependências para navegar entre os
 * depoimentos de clientes. Funciona com:
 *   - Botões de seta (anterior / próximo)
 *   - Indicadores (dots) clicáveis
 *   - Setas do teclado (quando o carrossel está focado)
 *   - Swipe em telas touch
 *
 * Uso: basta ter no HTML um elemento com [data-carousel],
 * contendo [data-carousel-track], [data-carousel-prev],
 * [data-carousel-next] e [data-carousel-dots].
 */
(function () {
  'use strict';

  function initCarousel(root) {
    const track = root.querySelector('[data-carousel-track]');
    const prevButton = root.querySelector('[data-carousel-prev]');
    const nextButton = root.querySelector('[data-carousel-next]');
    const dotsContainer = root.querySelector('[data-carousel-dots]');
    const slides = Array.from(track.children);

    if (slides.length === 0) return;

    let currentIndex = 0;

    // Respeita a preferência do usuário por menos animação
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Cria um indicador (dot) para cada slide
    const dots = slides.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'depoimento-carousel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Ir para depoimento ' + (index + 1));
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
      return dot;
    });

    function updateUI() {
      const offset = currentIndex * 100;
      track.style.transform = 'translateX(-' + offset + '%)';
      track.style.transition = prefersReducedMotion ? 'none' : 'transform 0.35s ease';

      dots.forEach((dot, index) => {
        const isActive = index === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-selected', String(isActive));
        dot.tabIndex = isActive ? 0 : -1;
      });

      // Evita que leitores de tela leiam os slides fora de vista
      slides.forEach((slide, index) => {
        slide.setAttribute('aria-hidden', String(index !== currentIndex));
      });

      prevButton.disabled = slides.length <= 1;
      nextButton.disabled = slides.length <= 1;
    }

    function goToSlide(index) {
      currentIndex = (index + slides.length) % slides.length;
      updateUI();
    }

    function goToNext() {
      goToSlide(currentIndex + 1);
    }

    function goToPrevious() {
      goToSlide(currentIndex - 1);
    }

    prevButton.addEventListener('click', goToPrevious);
    nextButton.addEventListener('click', goToNext);

    // Navegação por teclado (setas esquerda/direita quando o carrossel tem foco)
    root.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      }
    });

    // Suporte a swipe em dispositivos touch
    let touchStartX = 0;
    const SWIPE_THRESHOLD = 40; // pixels mínimos para considerar um swipe

    track.addEventListener('touchstart', (event) => {
      touchStartX = event.touches[0].clientX;
    }, { passive: true });

    track.addEventListener('touchend', (event) => {
      const touchEndX = event.changedTouches[0].clientX;
      const delta = touchEndX - touchStartX;

      if (Math.abs(delta) < SWIPE_THRESHOLD) return;

      if (delta < 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }, { passive: true });

    updateUI();
  }

  function init() {
    const carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach(initCarousel);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * Validação do formulário de contato
 * -------------------------------------------------
 * Valida nome, e-mail e mensagem antes do envio, mostrando
 * mensagens de erro específicas e acessíveis (role="alert")
 * ao lado de cada campo.
 *
 * Observação: o formulário atual usa action="mailto:...", que
 * apenas abre o cliente de e-mail do usuário. Esta validação
 * melhora a experiência antes desse envio, mas para confirmação
 * real de recebimento, o ideal é trocar por um backend próprio
 * ou um serviço como Formspree.
 */
(function () {
  'use strict';

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function initFormValidation(form) {
    const nome = form.querySelector('#nome');
    const email = form.querySelector('#email');
    const mensagem = form.querySelector('#mensagem');

    const campos = [
      {
        input: nome,
        erroEl: form.querySelector('#nome-erro'),
        validar: (valor) => (valor.trim().length >= 2 ? '' : 'Digite seu nome completo.'),
      },
      {
        input: email,
        erroEl: form.querySelector('#email-erro'),
        validar: (valor) =>
          EMAIL_REGEX.test(valor.trim()) ? '' : 'Digite um e-mail válido, ex: nome@exemplo.com.',
      },
      {
        input: mensagem,
        erroEl: form.querySelector('#mensagem-erro'),
        validar: (valor) =>
          valor.trim().length >= 10 ? '' : 'Escreva uma mensagem com pelo menos 10 caracteres.',
      },
    ];

    function validarCampo(campo) {
      const mensagemErro = campo.validar(campo.input.value);
      campo.erroEl.textContent = mensagemErro;
      campo.input.setAttribute('aria-invalid', mensagemErro ? 'true' : 'false');
      return mensagemErro === '';
    }

    // Valida cada campo assim que o usuário sai dele (blur),
    // em vez de mostrar erros enquanto ele ainda está digitando.
    campos.forEach((campo) => {
      campo.input.addEventListener('blur', () => validarCampo(campo));
    });

    form.addEventListener('submit', (event) => {
      const resultados = campos.map(validarCampo);
      const formularioValido = resultados.every(Boolean);

      if (!formularioValido) {
        event.preventDefault();
        // Leva o foco para o primeiro campo com erro, ajudando
        // quem navega por teclado ou leitor de tela.
        const primeiroCampoComErro = campos.find((_, index) => !resultados[index]);
        if (primeiroCampoComErro) {
          primeiroCampoComErro.input.focus();
        }
      }
    });
  }

  function init() {
    const forms = document.querySelectorAll('[data-form-contato]');
    forms.forEach(initFormValidation);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();