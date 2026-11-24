(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const params = new URLSearchParams(window.location.search);
  const queryInput = $('#resultsQuery');
  const locationInput = $('#resultsLocation');
  const grid = $('#resultsGrid');
  const savedKey = 'vindarrDiscoverSaved';
  const pageSize = 10;

  const categoryNames = {
    all: 'All results', jobs: 'Jobs & Careers', scholarships: 'Scholarships',
    funding: 'Funding', business: 'Business Services', stores: 'Stores',
    restaurants: 'Food & Dining', services: 'Other Services'
  };

  const starterListings = [
    {id:'jobberman',title:'Jobberman Nigeria',description:'Explore job vacancies, internships and career resources from employers and recruiters in Nigeria.',category:'jobs',url:'https://www.jobberman.com/jobs',source:'Jobberman',location:'Nigeria',official:true,tags:['Jobs','Internships','Nigeria']},
    {id:'linkedin-jobs',title:'LinkedIn Jobs',description:'Search professional opportunities, remote roles and internships around the world.',category:'jobs',url:'https://www.linkedin.com/jobs/',source:'LinkedIn',location:'Worldwide',official:true,tags:['Jobs','Remote','Professional']},
    {id:'ngcareers',title:'NGCareers',description:'Explore career opportunities and employer information relevant to the Nigerian job market.',category:'jobs',url:'https://www.ngcareers.com/',source:'NGCareers',location:'Nigeria',official:true,tags:['Jobs','Career advice']},
    {id:'opportunities-youth',title:'Opportunities For Youth',description:'Browse internships, competitions, fellowships, scholarships and youth programmes.',category:'scholarships',url:'https://www.opportunitiesfor-youth.org/',source:'Opportunities For Youth',location:'Worldwide',official:false,tags:['Youth','Fellowships','Global']},
    {id:'scholarship-positions',title:'Scholarship Positions',description:'Explore scholarship announcements and study opportunities from institutions around the world.',category:'scholarships',url:'https://scholarship-positions.com/',source:'Scholarship Positions',location:'Worldwide',official:false,tags:['Scholarships','Study abroad']},
    {id:'erasmus',title:'Erasmus Mundus Joint Masters',description:'Learn about joint masters programmes and scholarship opportunities offered by European universities.',category:'scholarships',url:'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters',source:'European Commission',location:'Europe / International',official:true,tags:['Masters','Scholarships']},
    {id:'smedan',title:'SMEDAN',description:'Find business support, programmes and enterprise resources from Nigeria’s small and medium enterprise development agency.',category:'funding',url:'https://smedan.gov.ng/',source:'SMEDAN',location:'Nigeria',official:true,tags:['SME support','Business']},
    {id:'boi',title:'Bank of Industry',description:'Explore financing products and business support information for eligible Nigerian enterprises.',category:'funding',url:'https://www.boi.ng/',source:'Bank of Industry',location:'Nigeria',official:true,tags:['Business finance','Loans']},
    {id:'tef',title:'Tony Elumelu Foundation',description:'Explore entrepreneurship programmes, business training and funding opportunities when application windows are open.',category:'funding',url:'https://www.tonyelumelufoundation.org/',source:'Tony Elumelu Foundation',location:'Africa',official:true,tags:['Entrepreneurs','Africa','Funding']},
    {id:'cac-search',title:'CAC Company Search',description:'Search Corporate Affairs Commission records to check company names and registration information.',category:'business',url:'https://www.cac.gov.ng/services/company-search',source:'Corporate Affairs Commission',location:'Nigeria',official:true,tags:['Company search','Verification']},
    {id:'cac-register',title:'CAC Company Registration',description:'Access official information and steps for registering a business or company in Nigeria.',category:'business',url:'https://www.cac.gov.ng/services/company-registration',source:'Corporate Affairs Commission',location:'Nigeria',official:true,tags:['Business registration','Official']},
    {id:'nafdac',title:'NAFDAC',description:'Access official information about product regulation, registration and safety alerts in Nigeria.',category:'business',url:'https://www.nafdac.gov.ng/',source:'NAFDAC',location:'Nigeria',official:true,tags:['Product regulation','Food']},
    {id:'google-maps',title:'Google Maps Restaurants',description:'Find nearby restaurants, shops and services. Check provider details and contact information.',category:'restaurants',url:'https://www.google.com/maps/search/restaurants/',source:'Google Maps',location:'Choose your location',official:false,tags:['Restaurants','Nearby','Places']},
    {id:'tripadvisor',title:'Tripadvisor Restaurants',description:'Browse restaurant listings, traveller reviews and dining recommendations around the world.',category:'restaurants',url:'https://www.tripadvisor.com/Restaurants',source:'Tripadvisor',location:'Worldwide',official:false,tags:['Restaurants','Reviews']},
    {id:'jumia',title:'Jumia',description:'Explore online shopping categories and marketplace sellers in Nigeria.',category:'stores',url:'https://www.jumia.com.ng/',source:'Jumia',location:'Nigeria',official:true,tags:['Shopping','Marketplace']},
    {id:'konga',title:'Konga',description:'Browse electronics, home, fashion and other shopping categories.',category:'stores',url:'https://www.konga.com/',source:'Konga',location:'Nigeria',official:true,tags:['Shopping','Electronics']},
    {id:'jobberman-career',title:'Jobberman Career Resources',description:'Explore career guidance, employability resources and training information for job seekers.',category:'services',url:'https://www.jobberman.com/',source:'Jobberman',location:'Nigeria',official:true,tags:['Career support','Training']}
  ];

  let activeCategory = params.get('category') || 'all';
  let allResults = [];
  let visibleCount = pageSize;
  let loading = false;

  function readSaved() {
    try {
      return JSON.parse(localStorage.getItem(savedKey) || '[]');
    } catch {
      return [];
    }
  }

  function writeSaved(items) {
    localStorage.setItem(savedKey, JSON.stringify(items));
  }

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      '"':'&quot;',
      "'":'&#39;'
    })[char]);
  }

  function validHttpUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  function iconFor(category) {
    return ({
      jobs:'bi-briefcase',
      scholarships:'bi-mortarboard',
      funding:'bi-cash-stack',
      business:'bi-buildings',
      stores:'bi-shop',
      restaurants:'bi-cup-hot',
      services:'bi-tools'
    })[category] || 'bi-globe2';
  }

  function setActiveCategory(category) {
    activeCategory = category;

    document.querySelectorAll('[data-category]').forEach(button => {
      button.classList.toggle(
        'active',
        button.dataset.category === category
      );
    });
  }

  function getFilteredResults() {
    const term = (queryInput.value || '').trim().toLowerCase();
    const location = (locationInput.value || '').trim().toLowerCase();
    const saved = readSaved();

    let items = allResults.filter(item => {
      const text = [
        item.title,
        item.description,
        item.category,
        item.source,
        item.location,
        ...(item.tags || [])
      ].join(' ').toLowerCase();

      const termMatch =
        !term ||
        text.includes(term) ||
        item.category === activeCategory;

      const loc = String(item.location || '').toLowerCase();

      const locationMatch =
        !location ||
        loc.includes(location) ||
        loc.includes('worldwide') ||
        loc.includes('online') ||
        loc.includes('choose your location');

      return (
        (activeCategory === 'all' || item.category === activeCategory) &&
        termMatch &&
        locationMatch &&
        (!$('#officialOnly').checked || item.official === true) &&
        (!$('#savedOnly').checked || saved.includes(item.id))
      );
    });

    if ($('#sortSelect').value === 'name') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    return items;
  }

  function render() {
    const items = getFilteredResults();
    const visible = items.slice(0, visibleCount);

    grid.innerHTML = visible.map(item => {
      const saved = readSaved().includes(item.id);

      const tags = (item.tags || [])
        .slice(0, 3)
        .map(tag => `<span class="listing-tag">${escapeHtml(tag)}</span>`)
        .join('');

      let host = item.source || '';

      try {
        host = host || new URL(item.url).hostname;
      } catch {}

      return `
        <article class="listing-card">
          <div class="listing-top">
            <div class="listing-brand">
              <span class="listing-mark">
                <i class="bi ${iconFor(item.category)}"></i>
              </span>

              <div>
                <strong>${escapeHtml(item.title)}</strong>
                <small>
                  ${escapeHtml(categoryNames[item.category] || 'Service')}
                  · ${escapeHtml(item.location || 'Online')}
                </small>
              </div>
            </div>

            <button
              class="save-listing ${saved ? 'saved' : ''}"
              type="button"
              data-save="${escapeHtml(item.id)}"
              aria-label="${saved ? 'Remove saved listing' : 'Save listing'}"
            >
              <i class="bi ${saved ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
            </button>
          </div>

          <p class="listing-description">
            ${escapeHtml(item.description || 'Open the original website for more information.')}
          </p>

          <div class="listing-meta">
            ${tags}
            ${item.official ? '<span class="listing-tag provider-tag">Provider website</span>' : ''}
          </div>

          <div class="listing-footer">
            <span class="source-label">Source: ${escapeHtml(host)}</span>

            <a
              class="visit-link"
              href="${escapeHtml(item.url)}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit website <i class="bi bi-box-arrow-up-right"></i>
            </a>
          </div>
        </article>
      `;
    }).join('');

    $('#resultCount').textContent =
      `${items.length} result${items.length === 1 ? '' : 's'}`;

    $('#emptyState').hidden = items.length !== 0;

    $('#loadMoreBtn').hidden =
      visibleCount >= items.length || items.length === 0;

    $('#resultsTitle').textContent =
      queryInput.value.trim()
        ? `Results for “${queryInput.value.trim()}”`
        : (categoryNames[activeCategory] || 'Search results');

    $('#resultsSubtitle').textContent = $('#officialOnly').checked
      ? 'Showing listings marked as provider websites in the Vindarr directory.'
      : 'Explore useful websites and opportunities. Open a result to continue with the original provider.';
  }

  function normalizeLiveResult(item, index) {
    if (!item || !validHttpUrl(item.url)) return null;

    let hostname = new URL(item.url).hostname;

    return {
      id: String(item.id || `web-${index}-${item.url}`),
      title: item.title || item.name || hostname,
      description: item.description || item.snippet || 'Open the original website for more information.',
      category: item.category || (activeCategory === 'all' ? 'services' : activeCategory),
      url: item.url,
      source: item.source || hostname,
      location: item.location || 'Online',
      official: item.official === true,
      tags: Array.isArray(item.tags) ? item.tags : ['Web result'],
      updatedAt: item.updatedAt || null
    };
  }

  async function runSearch() {
    if (loading) return;

    loading = true;
    $('#loadingState').hidden = false;
    $('#emptyState').hidden = true;
    grid.innerHTML = '';
    visibleCount = pageSize;

    const query = queryInput.value.trim();
    const location = locationInput.value.trim();

    let results = [...starterListings];

    const endpoint =
      window.VINDARR_DISCOVER_SEARCH_URL ||
      (window.API_BASE_URL
        ? `${window.API_BASE_URL.replace(/\/$/, '')}/discover/search`
        : null);

    if (endpoint && query.length >= 2) {
      try {
        const url = new URL(endpoint, window.location.origin);

        url.searchParams.set('q', query);
        url.searchParams.set('category', activeCategory);

        if (location) {
          url.searchParams.set('location', location);
        }

        const response = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Search request failed (${response.status})`);
        }

        const data = await response.json();
        const rows = Array.isArray(data) ? data : data.results;

        if (Array.isArray(rows) && rows.length) {
          results = rows
            .map(normalizeLiveResult)
            .filter(Boolean);
        }

      } catch (error) {
        console.warn(
          'Vindarr live search unavailable; showing directory results.',
          error
        );
      }
    }

    allResults = results;

    $('#loadingState').hidden = true;
    loading = false;

    render();
  }

  $('#resultsSearchForm').addEventListener('submit', event => {
    event.preventDefault();

    const next = new URLSearchParams();

    next.set('q', queryInput.value.trim());
    next.set('category', activeCategory);

    if (locationInput.value.trim()) {
      next.set('location', locationInput.value.trim());
    }

    history.pushState(
      {},
      '',
      `discover-results.html?${next.toString()}`
    );

    runSearch();
  });

  document.querySelectorAll('.side-category').forEach(button => {
    button.addEventListener('click', () => {
      setActiveCategory(button.dataset.category);
      runSearch();
    });
  });

  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-save]');

    if (!button) return;

    const id = button.dataset.save;
    const saved = readSaved();

    writeSaved(
      saved.includes(id)
        ? saved.filter(value => value !== id)
        : [...saved, id]
    );

    render();
  });

  ['officialOnly', 'savedOnly', 'sortSelect'].forEach(id => {
    $('#' + id).addEventListener('change', render);
  });

  $('#filterToggle').addEventListener('click', () => {
    $('#filterRow').classList.toggle('filters-open');
  });

  $('#loadMoreBtn').addEventListener('click', () => {
    visibleCount += pageSize;
    render();
  });

  $('#savedToggle').addEventListener('click', () => {
    const checkbox = $('#savedOnly');
    checkbox.checked = !checkbox.checked;
    render();
  });

  queryInput.value = params.get('q') || '';
  locationInput.value = params.get('location') || '';

  setActiveCategory(activeCategory);
  runSearch();
})();