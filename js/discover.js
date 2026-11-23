
/* =========================================
   VINDARR DISCOVER
   Starter directory + optional live search
   =========================================

   Optional backend endpoint:
   GET /discover/search?q=...&category=...&location=...

   Expected JSON:
   {
     "results": [
       {
         "id": "listing-1",
         "title": "Example Opportunity",
         "description": "Description",
         "category": "jobs",
         "url": "https://example.com",
         "source": "Example Provider",
         "location": "Nigeria",
         "official": true,
         "tags": ["Jobs", "Nigeria"]
       }
     ]
   }
*/

(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);

  const grid = $('#resultsGrid');
  const queryInput = $('#discoverQuery');
  const locationInput = $('#discoverLocation');
  const categoryGrid = $('#categoryGrid');

  const savedKey = 'vindarrDiscoverSaved';

  // =========================================
  // STARTER DIRECTORY
  // =========================================

  const listings = [
    {
      id: 'jobberman',
      title: 'Jobberman Nigeria',
      description: 'Explore job vacancies, internships and career resources from employers and recruiters in Nigeria.',
      category: 'jobs',
      url: 'https://www.jobberman.com/jobs',
      source: 'Jobberman',
      location: 'Nigeria',
      official: true,
      tags: ['Jobs', 'Internships', 'Nigeria']
    },

    {
      id: 'linkedin-jobs',
      title: 'LinkedIn Jobs',
      description: 'Search professional opportunities, remote roles and internships, and explore employers and professional networks.',
      category: 'jobs',
      url: 'https://www.linkedin.com/jobs/',
      source: 'LinkedIn',
      location: 'Worldwide',
      official: true,
      tags: ['Jobs', 'Remote', 'Professional']
    },

    {
      id: 'ngcareers',
      title: 'NGCareers',
      description: 'Discover career opportunities, career advice and employer information relevant to the Nigerian job market.',
      category: 'jobs',
      url: 'https://www.ngcareers.com/',
      source: 'NGCareers',
      location: 'Nigeria',
      official: true,
      tags: ['Jobs', 'Career advice', 'Nigeria']
    },

    {
      id: 'opportunities-for-youth',
      title: 'Opportunities For Youth',
      description: 'Browse opportunities including internships, competitions, fellowships, scholarships and youth programmes.',
      category: 'scholarships',
      url: 'https://www.opportunitiesfor-youth.org/',
      source: 'Opportunities For Youth',
      location: 'Worldwide',
      official: true,
      tags: ['Youth', 'Fellowships', 'Global']
    },

    {
      id: 'scholarship-positions',
      title: 'Scholarship Positions',
      description: 'Explore scholarship announcements and study opportunities from universities and institutions around the world.',
      category: 'scholarships',
      url: 'https://scholarship-positions.com/',
      source: 'Scholarship Positions',
      location: 'Worldwide',
      official: false,
      tags: ['Scholarships', 'Study abroad', 'Education']
    },

    {
      id: 'erasmus',
      title: 'Erasmus Mundus Joint Masters',
      description: 'Learn about joint master’s programmes and scholarship opportunities offered by participating European universities.',
      category: 'scholarships',
      url: 'https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/erasmus-mundus-joint-masters',
      source: 'European Commission',
      location: 'Europe / International',
      official: true,
      tags: ['Masters', 'Scholarships', 'Europe']
    },

    {
      id: 'smedan',
      title: 'SMEDAN',
      description: 'Nigeria’s small and medium enterprise development agency. Find business support, programmes and enterprise resources.',
      category: 'funding',
      url: 'https://smedan.gov.ng/',
      source: 'SMEDAN',
      location: 'Nigeria',
      official: true,
      tags: ['SME support', 'Business', 'Nigeria']
    },

    {
      id: 'boi',
      title: 'Bank of Industry',
      description: 'Explore financing products and business support information for eligible Nigerian enterprises.',
      category: 'funding',
      url: 'https://www.boi.ng/',
      source: 'Bank of Industry',
      location: 'Nigeria',
      official: true,
      tags: ['Business finance', 'Loans', 'Nigeria']
    },

    {
      id: 'tonyelumelu',
      title: 'Tony Elumelu Foundation',
      description: 'Explore entrepreneurship programmes, business training and funding opportunities when application windows are open.',
      category: 'funding',
      url: 'https://www.tonyelumelufoundation.org/',
      source: 'Tony Elumelu Foundation',
      location: 'Africa',
      official: true,
      tags: ['Entrepreneurs', 'Africa', 'Funding']
    },

    {
      id: 'cac-search',
      title: 'CAC Company Search',
      description: 'Search the Corporate Affairs Commission records to check company names and registration information.',
      category: 'business',
      url: 'https://www.cac.gov.ng/services/company-search',
      source: 'Corporate Affairs Commission',
      location: 'Nigeria',
      official: true,
      tags: ['Company search', 'Verification', 'Official']
    },

    {
      id: 'cac-register',
      title: 'CAC Company Registration',
      description: 'Access official information and steps for registering a business or company in Nigeria.',
      category: 'business',
      url: 'https://www.cac.gov.ng/services/company-registration',
      source: 'Corporate Affairs Commission',
      location: 'Nigeria',
      official: true,
      tags: ['Business registration', 'Official', 'Nigeria']
    },

    {
      id: 'nafdaq',
      title: 'NAFDAC',
      description: 'Access official information about product regulation, registration, safety alerts and regulated products in Nigeria.',
      category: 'business',
      url: 'https://www.nafdac.gov.ng/',
      source: 'NAFDAC',
      location: 'Nigeria',
      official: true,
      tags: ['Product regulation', 'Food', 'Health']
    },

    {
      id: 'google-maps',
      title: 'Google Maps',
      description: 'Find nearby restaurants, shops, professional services and places. Check provider details and contact information.',
      category: 'restaurants',
      url: 'https://www.google.com/maps/search/restaurants/',
      source: 'Google Maps',
      location: 'Choose your location',
      official: true,
      tags: ['Restaurants', 'Nearby', 'Places']
    },

    {
      id: 'tripadvisor-restaurants',
      title: 'Tripadvisor Restaurants',
      description: 'Browse restaurant listings, traveller reviews and dining recommendations in destinations around the world.',
      category: 'restaurants',
      url: 'https://www.tripadvisor.com/Restaurants',
      source: 'Tripadvisor',
      location: 'Worldwide',
      official: true,
      tags: ['Restaurants', 'Reviews', 'Dining']
    },

    {
      id: 'jumia',
      title: 'Jumia',
      description: 'Explore online shopping categories and marketplace sellers. Review seller, delivery and return information before buying.',
      category: 'stores',
      url: 'https://www.jumia.com.ng/',
      source: 'Jumia',
      location: 'Nigeria',
      official: true,
      tags: ['Shopping', 'Marketplace', 'Nigeria']
    },

    {
      id: 'konga',
      title: 'Konga',
      description: 'Browse products across electronics, home, fashion and other shopping categories from an online marketplace.',
      category: 'stores',
      url: 'https://www.konga.com/',
      source: 'Konga',
      location: 'Nigeria',
      official: true,
      tags: ['Shopping', 'Electronics', 'Nigeria']
    },

    {
      id: 'jobberman-training',
      title: 'Jobberman Career Resources',
      description: 'Explore career guidance, employability resources and training information for job seekers.',
      category: 'services',
      url: 'https://www.jobberman.com/',
      source: 'Jobberman',
      location: 'Nigeria',
      official: true,
      tags: ['Career support', 'Training', 'Nigeria']
    }
  ];

  // =========================================
  // CATEGORY LABELS
  // =========================================

  const categoryNames = {
    all: 'Everything',
    jobs: 'Jobs & Careers',
    scholarships: 'Scholarships',
    funding: 'Funding',
    business: 'Business Services',
    stores: 'Stores',
    restaurants: 'Food & Dining',
    services: 'Other Services'
  };

  let activeCategory = 'all';
  let currentResults = [...listings];
  let pageSize = 9;
  let liveResultsUsed = false;

  // =========================================
  // SAVED LISTINGS
  // =========================================

  function readSaved() {
    try {
      return JSON.parse(
        localStorage.getItem(savedKey) || '[]'
      );
    } catch {
      return [];
    }
  }

  function writeSaved(ids) {
    localStorage.setItem(
      savedKey,
      JSON.stringify(ids)
    );
  }

  // =========================================
  // HTML SAFETY
  // =========================================

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character]));
  }

  // =========================================
  // CATEGORY ICONS
  // =========================================

  function iconFor(category) {
    return ({
      jobs: 'bi-briefcase',
      scholarships: 'bi-mortarboard',
      funding: 'bi-cash-stack',
      business: 'bi-buildings',
      stores: 'bi-shop',
      restaurants: 'bi-cup-hot',
      services: 'bi-tools'
    })[category] || 'bi-globe2';
  }

  // =========================================
  // FILTER MATCHING
  // =========================================

  function matches(item, term, location) {
    const searchableContent = [
      item.title,
      item.description,
      item.category,
      item.source,
      item.location,
      ...(item.tags || [])
    ].join(' ').toLowerCase();

    const matchesTerm =
      !term || searchableContent.includes(term);

    const itemLocation = String(
      item.location || ''
    ).toLowerCase();

    const matchesLocation =
      !location ||
      itemLocation.includes(location) ||
      itemLocation === 'worldwide' ||
      itemLocation.includes('choose your location');

    return matchesTerm && matchesLocation;
  }

  // =========================================
  // RENDER LISTINGS
  // =========================================

  function render() {
    const term = queryInput.value.trim().toLowerCase();

    const location = locationInput.value
      .trim()
      .toLowerCase();

    const officialOnly = $('#officialOnly').checked;
    const savedOnly = $('#savedOnly').checked;

    const saved = readSaved();

    let filtered = currentResults.filter(item => {
      return (
        (activeCategory === 'all' ||
          item.category === activeCategory) &&
        matches(item, term, location) &&
        (!officialOnly || item.official) &&
        (!savedOnly || saved.includes(item.id))
      );
    });

    if ($('#sortSelect').value === 'name') {
      filtered.sort((a, b) =>
        a.title.localeCompare(b.title)
      );
    }

    $('#resultsTitle').textContent = term
      ? `Results for “${queryInput.value.trim()}”`
      : categoryNames[activeCategory] || 'Explore useful places';

    $('#resultsSubtitle').textContent = liveResultsUsed
      ? 'Search results from the connected web-search service. Open the original provider for full details.'
      : 'Useful starting points from the Vindarr directory. Search results can be expanded by connecting live web search.';

    $('#resultCount').textContent =
      `${filtered.length} listing${filtered.length === 1 ? '' : 's'}`;

    grid.innerHTML = filtered
      .slice(0, pageSize)
      .map(item => {
        const isSaved = saved.includes(item.id);

        const tags = (item.tags || [])
          .slice(0, 3)
          .map(tag =>
            `<span class="listing-tag">${escapeHtml(tag)}</span>`
          )
          .join('');

        const source = item.source ||
          new URL(item.url).hostname;

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
                    ·
                    ${escapeHtml(item.location || 'Online')}
                  </small>
                </div>

              </div>

              <button
                class="save-listing ${isSaved ? 'saved' : ''}"
                type="button"
                data-save="${escapeHtml(item.id)}"
                aria-label="${isSaved ? 'Remove saved listing' : 'Save listing'}"
              >
                <i class="bi ${isSaved ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
              </button>

            </div>

            <p class="listing-description">
              ${escapeHtml(item.description)}
            </p>

            <div class="listing-meta">
              ${tags}
              ${item.official
                ? '<span class="listing-tag">Provider website</span>'
                : ''}
            </div>

            <div class="listing-footer">

              <span class="source-label">
                Source: ${escapeHtml(source)}
              </span>

              <a
                class="visit-link"
                href="${escapeHtml(item.url)}"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit website
                <i class="bi bi-box-arrow-up-right"></i>
              </a>

            </div>

          </article>
        `;
      })
      .join('');

    $('#emptyState').hidden = filtered.length > 0;

    $('#loadMoreBtn').hidden =
      filtered.length <= pageSize;
  }

  // =========================================
  // SEARCH
  // =========================================

  async function search() {
    const term = queryInput.value.trim();
    const location = locationInput.value.trim();

    pageSize = 9;
    liveResultsUsed = false;

    // Start with local directory results.
    currentResults = [...listings];

    const base = window.API_BASE_URL || '';

    const endpoint =
      window.VINDARR_DISCOVER_SEARCH_URL ||
      (base
        ? `${base.replace(/\/$/, '')}/discover/search`
        : null);

    if (term && endpoint) {
      try {
        const url = new URL(
          endpoint,
          window.location.origin
        );

        url.searchParams.set('q', term);

        if (activeCategory !== 'all') {
          url.searchParams.set(
            'category',
            activeCategory
          );
        }

        if (location) {
          url.searchParams.set('location', location);
        }

        const token = localStorage.getItem('token');

        const response = await fetch(
          url.toString(),
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {}
          }
        );

        if (response.ok) {
          const data = await response.json();

          const rows = Array.isArray(data)
            ? data
            : data.results;

          if (Array.isArray(rows)) {
            const normalized = rows
              .filter(item =>
                item &&
                item.url &&
                /^https?:\/\//i.test(item.url)
              )
              .map((item, index) => ({
                id: String(
                  item.id || `web-${index}-${item.url}`
                ),

                title:
                  item.title ||
                  item.name ||
                  'External listing',

                description:
                  item.description ||
                  item.snippet ||
                  'Open the original website for more information.',

                category:
                  item.category ||
                  (activeCategory === 'all'
                    ? 'services'
                    : activeCategory),

                url: item.url,

                source:
                  item.source ||
                  new URL(item.url).hostname,

                location:
                  item.location ||
                  'Online',

                official: Boolean(item.official),

                tags: item.tags || [],

                updatedAt: item.updatedAt
              }));

            currentResults = normalized;
            liveResultsUsed = true;
          }
        }
      } catch (error) {
        console.warn(
          'Vindarr Discover live search unavailable; showing directory results.',
          error
        );
      }
    }

    render();
  }

  // =========================================
  // SEARCH FORM
  // =========================================

  $('#discoverSearchForm').addEventListener(
    'submit',
    event => {
      event.preventDefault();
      search();
    }
  );

  // =========================================
  // CATEGORY FILTERS
  // =========================================

  categoryGrid.addEventListener(
    'click',
    event => {
      const button = event.target.closest('[data-category]');

      if (!button) return;

      activeCategory = button.dataset.category;

      categoryGrid
        .querySelectorAll('.category-tile')
        .forEach(tile => {
          tile.classList.toggle(
            'selected',
            tile === button
          );
        });

      search();
    }
  );

  $('#clearCategory').addEventListener(
    'click',
    () => {
      activeCategory = 'all';

      categoryGrid
        .querySelectorAll('.category-tile')
        .forEach(tile => {
          tile.classList.toggle(
            'selected',
            tile.dataset.category === 'all'
          );
        });

      search();
    }
  );

  // =========================================
  // POPULAR SEARCHES
  // =========================================

  document
    .querySelectorAll('.search-hints button')
    .forEach(button => {
      button.addEventListener('click', () => {
        queryInput.value = button.dataset.query;
        search();
      });
    });

  // =========================================
  // SAVE / UNSAVE LISTINGS
  // =========================================

  grid.addEventListener(
    'click',
    event => {
      const button = event.target.closest('[data-save]');

      if (!button) return;

      const id = button.dataset.save;

      let saved = readSaved();

      saved = saved.includes(id)
        ? saved.filter(item => item !== id)
        : [...saved, id];

      writeSaved(saved);

      render();
    }
  );

  // =========================================
  // FILTERS AND SORTING
  // =========================================

  [
    'officialOnly',
    'savedOnly',
    'sortSelect'
  ].forEach(id => {
    $('#' + id).addEventListener(
      'change',
      render
    );
  });

  $('#filterToggle').addEventListener(
    'click',
    () => {
      $('#filterRow').classList.toggle(
        'filters-open'
      );
    }
  );

  // =========================================
  // LOAD MORE
  // =========================================

  $('#loadMoreBtn').addEventListener(
    'click',
    () => {
      pageSize += 9;
      render();
    }
  );

  // =========================================
  // SAVED LISTINGS SHORTCUT
  // =========================================

  $('#savedToggle').addEventListener(
    'click',
    () => {
      const checkbox = $('#savedOnly');

      checkbox.checked = !checkbox.checked;

      render();

      $('#resultsSection').scrollIntoView({
        behavior: 'smooth'
      });
    }
  );

  // =========================================
  // INITIAL PAGE LOAD
  // =========================================

  render();

})();
