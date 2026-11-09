(function (global, factory) {
  'use strict';
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global.document) api.mount(global.document, global.navigator || {});
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function buildWhatsAppUrl(base, service) {
    const url = new URL(base);
    if (url.protocol !== 'https:' || url.hostname !== 'wa.me') throw new Error('Expected a WhatsApp link');
    url.searchParams.set('text', 'Здравствуйте! Подскажите, пожалуйста, по услуге: ' + service + '.');
    return url.href;
  }
  async function copyText(text, navigatorLike) {
    if (!navigatorLike.clipboard || typeof navigatorLike.clipboard.writeText !== 'function') return false;
    try { await navigatorLike.clipboard.writeText(text); return true; } catch (_) { return false; }
  }
  function manualSelect(doc, target) {
    try {
      const selection = doc.getSelection();
      if (!selection) return false;
      const range = doc.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges(); selection.addRange(range);
      target.setAttribute('tabindex', '-1');
      target.focus({preventScroll:true});
      return true;
    } catch (_) { return false; }
  }
  function mount(doc, navigatorLike) {
    doc.querySelectorAll('[data-service-select]').forEach(function (select) {
      const link = doc.getElementById(select.dataset.questionLink);
      if (!link) return;
      select.disabled = false;
      function updateQuestion() { link.href = buildWhatsAppUrl(select.dataset.waBase, select.value); }
      select.addEventListener('change', updateQuestion);
      updateQuestion();
    });
    doc.querySelectorAll('[data-copy-target]').forEach(function (button) {
      button.hidden = false;
      button.addEventListener('click', async function () {
        const target = doc.getElementById(button.dataset.copyTarget);
        const block = button.closest('.copy-block');
        const status = block && block.querySelector('.copy-status');
        if (!target || !status) return;
        const kind = button.dataset.copyKind || 'текст';
        button.disabled = true;
        status.textContent = '';
        const copied = await copyText(target.textContent.trim(), navigatorLike);
        if (copied) status.textContent = kind === 'адрес' ? 'Адрес скопирован.' : kind === 'номер' ? 'Номер скопирован.' : 'Текст скопирован.';
        else {
          const selected = manualSelect(doc, target);
          status.textContent = selected ? 'Автоматическое копирование недоступно. Текст выделен — скопируйте его вручную.' : 'Автоматическое копирование недоступно. Скопируйте ' + kind + ' из текста выше.';
        }
        button.disabled = false;
      });
    });
    const frame = doc.getElementById('site-preview');
    const stage = doc.getElementById('preview-stage');
    if (frame && stage) {
      const choices = Array.from(doc.querySelectorAll('[data-preview-slug]'));
      const modes = Array.from(doc.querySelectorAll('[data-preview-mode]'));
      let chosen = choices.find(function (button) { return button.getAttribute('aria-pressed') === 'true'; }) || choices[0];
      let mode = 'phone';
      function updatePreview(changeCompany) {
        if (!chosen) return;
        const name = chosen.dataset.previewName;
        const slug = chosen.dataset.previewSlug;
        const label = mode === 'phone' ? 'Телефон' : 'Компьютер';
        const source = './' + slug + '/index.html';
        if (changeCompany && frame.getAttribute('src') !== source) frame.setAttribute('src', source);
        frame.setAttribute('title', 'Предпросмотр: ' + name + ' — ' + label);
        stage.dataset.mode = mode;
        const heading = doc.getElementById('preview-heading');
        const description = doc.getElementById('preview-description');
        const open = doc.getElementById('preview-open');
        const status = doc.getElementById('preview-status');
        if (heading) heading.textContent = name;
        if (description) description.textContent = chosen.dataset.previewTag;
        if (open) open.href = source;
        if (status) status.textContent = name + ' · ' + label + (mode === 'phone' ? ', 390 пикселей' : ', по ширине окна');
        choices.forEach(function (button) { button.setAttribute('aria-pressed', String(button === chosen)); });
        modes.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.previewMode === mode)); });
      }
      choices.forEach(function (button) { button.disabled = false; button.addEventListener('click', function () { chosen = button; updatePreview(true); }); });
      modes.forEach(function (button) { button.disabled = false; button.addEventListener('click', function () { mode = button.dataset.previewMode; updatePreview(false); }); });
      updatePreview(false);
    }
  }
  return {buildWhatsAppUrl:buildWhatsAppUrl, copyText:copyText, manualSelect:manualSelect, mount:mount};
});
