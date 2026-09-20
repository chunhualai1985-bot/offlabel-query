(() => {
  'use strict';

  const data = Array.isArray(window.OFFLABEL_DATA) ? window.OFFLABEL_DATA : [];
  const $ = (id) => document.getElementById(id);
  const els = {
    search: $('searchInput'), clear: $('clearSearch'), department: $('departmentFilter'),
    grade: $('gradeFilter'), type: $('typeFilter'), reset: $('resetBtn'),
    emptyReset: $('emptyResetBtn'), list: $('resultList'), empty: $('emptyState'),
    summary: $('resultSummary'), footerCount: $('footerCount'), overlay: $('detailOverlay'),
    close: $('closeDetail'), share: $('shareBtn'), toast: $('toast')
  };

  const normalize = (value) => String(value ?? '').toLocaleLowerCase('zh-CN').replace(/\s+/g, ' ').trim();
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const gradeClass = (grade) => normalize(grade).startsWith('3') ? 'grade-3' : normalize(grade).startsWith('2') ? 'grade-2' : '';

  function unique(field) {
    return [...new Set(data.map(x => x[field]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
  }

  function fillSelect(select, values) {
    const frag = document.createDocumentFragment();
    values.forEach(value => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      frag.appendChild(option);
    });
    select.appendChild(frag);
  }

  function getFiltered() {
    const query = normalize(els.search.value);
    const terms = query.split(' ').filter(Boolean);
    return data.filter(item => {
      if (els.department.value && item.department !== els.department.value) return false;
      if (els.grade.value && item.grade !== els.grade.value) return false;
      if (els.type.value && item.type !== els.type.value) return false;
      if (!terms.length) return true;
      const haystack = normalize([item.drug, item.department, item.type, item.label, item.offLabel, item.evidence, item.grade].join(' '));
      return terms.every(term => haystack.includes(term));
    });
  }

  function render() {
    const results = getFiltered();
    els.summary.textContent = results.length === data.length ? `共收录 ${data.length} 项` : `找到 ${results.length} 项，共 ${data.length} 项`;
    els.list.replaceChildren();
    els.empty.hidden = results.length > 0;

    const frag = document.createDocumentFragment();
    results.forEach(item => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'result-card';
      card.setAttribute('aria-label', `查看${item.drug}详情`);
      card.innerHTML = `
        <div>
          <div class="card-top">
            <h3>${escapeHtml(item.drug)}</h3>
            <span class="tag ${gradeClass(item.grade)}">${escapeHtml(item.grade || '未标注')}</span>
          </div>
          <p class="meta">${escapeHtml(item.department)} · ${escapeHtml(item.type)} · ${escapeHtml(item.evidence)}</p>
          <p class="use-label">超说明书使用内容</p>
          <p class="use-text">${escapeHtml(item.offLabel)}</p>
        </div>
        <span class="card-arrow" aria-hidden="true">›</span>`;
      card.addEventListener('click', () => openDetail(item));
      frag.appendChild(card);
    });
    els.list.appendChild(frag);
  }

  function openDetail(item) {
    $('detailDepartment').textContent = item.department;
    $('detailTitle').textContent = item.drug;
    $('detailTags').innerHTML = `<span class="tag">${escapeHtml(item.type)}</span><span class="tag ${gradeClass(item.grade)}">${escapeHtml(item.grade)}</span>`;
    $('detailOffLabel').textContent = item.offLabel || '—';
    $('detailLabel').textContent = item.label || '—';
    $('detailEvidence').textContent = item.evidence || '—';
    $('detailGrade').textContent = item.grade || '—';
    $('detailVersion').textContent = item.version || '—';
    $('detailSourceNo').textContent = item.sourceNo ?? '—';
    els.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    els.close.focus();
  }

  function closeDetail() {
    els.overlay.hidden = true;
    document.body.style.overflow = '';
  }

  function reset() {
    els.search.value = '';
    els.department.value = '';
    els.grade.value = '';
    els.type.value = '';
    render();
    els.search.focus();
  }

  let toastTimer;
  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 1800);
  }

  async function share() {
    const payload = { title: document.title, text: '南昌市人民医院超说明书用药查询', url: location.href };
    try {
      if (navigator.share) await navigator.share(payload);
      else { await navigator.clipboard.writeText(location.href); toast('链接已复制'); }
    } catch (error) {
      if (error?.name !== 'AbortError') toast('暂时无法分享，请复制浏览器地址');
    }
  }

  fillSelect(els.department, unique('department'));
  fillSelect(els.grade, unique('grade'));
  fillSelect(els.type, unique('type'));
  els.footerCount.textContent = data.length;
  els.search.addEventListener('input', render);
  els.clear.addEventListener('click', () => { els.search.value = ''; render(); els.search.focus(); });
  [els.department, els.grade, els.type].forEach(el => el.addEventListener('change', render));
  els.reset.addEventListener('click', reset);
  els.emptyReset.addEventListener('click', reset);
  els.close.addEventListener('click', closeDetail);
  els.overlay.addEventListener('click', event => { if (event.target === els.overlay) closeDetail(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !els.overlay.hidden) closeDetail(); });
  els.share.addEventListener('click', share);
  render();
})();
