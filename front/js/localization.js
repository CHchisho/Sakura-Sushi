// <button id="lang-toggle">FI / EN</button>
//
// <h1 data-i18n="title"></h1>
// <p data-i18n="description"></p>

const translations = {
  fi: {
    title: 'Hei maailma',
    description: 'Tämä on suomenkielinen teksti.'
  },
  en: {
    title: 'Hello world',
    description: 'This is text in English.'
  }
};

let currentLang = 'en'; // Default language

function setLanguage(lang) {
  currentLang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = translations[lang][key];
  });
}

document.getElementById('lang-toggle').addEventListener('click', () => {
  setLanguage(currentLang === 'fi' ? 'en' : 'fi');
});

// Set initial language
setLanguage(currentLang);
