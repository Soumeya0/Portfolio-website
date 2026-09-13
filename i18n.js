document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var LANG_KEY = 'site-lang';

    function getSavedLang() {
        var saved = localStorage.getItem(LANG_KEY);
        return (saved === 'en' || saved === 'fr') ? saved : 'en';
    }

    function applyLanguage(lang) {
        var dict = translations[lang] || translations.en;

        document.documentElement.lang = lang;

        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) el.textContent = dict[key];
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
        });

        document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-aria');
            if (dict[key] !== undefined) el.setAttribute('aria-label', dict[key]);
        });

        document.querySelectorAll('.lang-btn').forEach(function (btn) {
            var isActive = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function setLanguage(lang) {
        localStorage.setItem(LANG_KEY, lang);
        applyLanguage(lang);
    }

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var lang = btn.getAttribute('data-lang');
            if (lang === getSavedLang()) return;
            setLanguage(lang);
        });
    });

    applyLanguage(getSavedLang());
});
