(() => {
  'use strict';

  const form = document.getElementById('discoverSearchForm');
  const queryInput = document.getElementById('discoverQuery');
  const locationInput = document.getElementById('discoverLocation');

  function goToResults(query, category = 'all') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (locationInput && locationInput.value.trim()) {
      params.set('location', locationInput.value.trim());
    }
    params.set('category', category || 'all');
    window.location.href = `discover-results.html?${params.toString()}`;
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const query = queryInput.value.trim();
      if (query.length < 2) {
        queryInput.focus();
        queryInput.setCustomValidity('Enter at least 2 characters to search.');
        queryInput.reportValidity();
        return;
      }
      queryInput.setCustomValidity('');
      goToResults(query);
    });
  }

  document.querySelectorAll('[data-query]').forEach(button => {
    button.addEventListener('click', () => {
      const query = button.dataset.query || '';
      if (queryInput) queryInput.value = query;
      goToResults(query, button.dataset.category || 'all');
    });
  });
})();