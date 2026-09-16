const contactForm = document.querySelector('#contato form');
const successMessage = document.querySelector('#success-message');

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  contactForm.hidden = true;
  successMessage.hidden = false;
  contactForm.reset();
});
