document.addEventListener('DOMContentLoaded', () => {
  const BRAND = {
    green: '#1f6b3f',
    greenSoft: '#4f9a6c',
    red: '#c8102e',
    sun: '#f2b632',
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hideMapShell(element) {
    const shell = element.closest('[data-map-shell]');

    if (shell) {
      shell.hidden = true;
    }
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').catch(() => {});
    });
  }

  function wireDeleteConfirmation() {
    document.querySelectorAll('.delete-form').forEach((form) => {
      form.addEventListener('submit', (event) => {
        if (!window.confirm('Are you sure you want to delete this story? This cannot be undone.')) {
          event.preventDefault();
        }
      });
    });
  }

  function wireTextareas() {
    document.querySelectorAll('textarea').forEach((textarea) => {
      const resize = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      textarea.addEventListener('input', resize);
      resize();
    });
  }

  function wireImagePreview() {
    const imageInput = document.getElementById('image');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewTag = document.getElementById('imagePreviewTag');
    const fileName = document.querySelector('[data-file-name]');
    let currentObjectUrl = null;

    if (!imageInput || !imagePreview || !imagePreviewTag) {
      return;
    }

    imageInput.addEventListener('change', (event) => {
      const [file] = event.target.files;

      if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
      }

      if (!file) {
        imagePreview.hidden = true;
        imagePreviewTag.removeAttribute('src');
        if (fileName) fileName.textContent = 'No file chosen';
        return;
      }

      currentObjectUrl = URL.createObjectURL(file);
      imagePreviewTag.src = currentObjectUrl;
      imagePreview.hidden = false;
      if (fileName) fileName.textContent = file.name;
    });
  }

  function loadLeaflet() {
    if (window.L) {
      return Promise.resolve(window.L);
    }

    return Promise.reject(new Error('Leaflet is not available on the page.'));
  }

  function buildTileLayer(L) {
    return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    });
  }

  // All values are escaped: titles, places and tags are user-submitted.
  function buildPopup(destination) {
    const tagMarkup = (destination.tags || [])
      .slice(0, 3)
      .map((tag) => `<span class="gem-popup__tag">${escapeHtml(tag.name)}</span>`)
      .join('');

    return `
      <div class="gem-popup">
        <img class="gem-popup__img" src="${escapeHtml(destination.imageUrl)}" alt="" loading="lazy">
        <p class="gem-popup__title">${escapeHtml(destination.title)}</p>
        <p class="gem-popup__place">${escapeHtml(destination.location || 'Malawi')}</p>
        ${tagMarkup ? `<div class="gem-popup__tags">${tagMarkup}</div>` : ''}
        <a class="gem-popup__link" href="${escapeHtml(destination.url)}">Read the story &rarr;</a>
      </div>
    `;
  }

  function createMap(L, element) {
    const map = L.map(element, {
      zoomControl: true,
      scrollWheelZoom: window.innerWidth > 768,
      tap: window.innerWidth <= 768,
    });

    buildTileLayer(L).addTo(map);
    return map;
  }

  async function renderCollectionMap(element) {
    const response = await fetch(element.dataset.source, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Destination request failed with ${response.status}`);
    }

    const data = await response.json();
    const destinations = (data.destinations || []).filter((destination) => (
      typeof destination.latitude === 'number' && typeof destination.longitude === 'number'
    ));

    if (!destinations.length) {
      hideMapShell(element);
      return;
    }

    const L = await loadLeaflet();
    const map = createMap(L, element);
    const bounds = [];

    destinations.forEach((destination) => {
      const marker = L.circleMarker([destination.latitude, destination.longitude], {
        radius: destination.featured ? 9 : 7,
        weight: 2,
        color: destination.featured ? BRAND.red : BRAND.green,
        fillColor: destination.featured ? BRAND.sun : BRAND.greenSoft,
        fillOpacity: 0.95,
      }).addTo(map);

      marker.bindPopup(buildPopup(destination), {
        closeButton: false,
        className: 'gem-popup-shell',
      });

      bounds.push([destination.latitude, destination.longitude]);
    });

    map.fitBounds(bounds, {
      padding: [30, 30],
      maxZoom: 8,
    });
  }

  async function renderSingleDestinationMap(element) {
    const latitude = Number.parseFloat(element.dataset.latitude || '');
    const longitude = Number.parseFloat(element.dataset.longitude || '');

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      hideMapShell(element);
      return;
    }

    const L = await loadLeaflet();
    const map = createMap(L, element);
    const title = element.dataset.title || 'Destination';
    const location = element.dataset.location || 'Malawi';

    L.circleMarker([latitude, longitude], {
      radius: 9,
      weight: 2,
      color: BRAND.red,
      fillColor: BRAND.sun,
      fillOpacity: 0.95,
    }).addTo(map).bindPopup(`
      <div class="gem-popup gem-popup--compact">
        <p class="gem-popup__title">${escapeHtml(title)}</p>
        <p class="gem-popup__place">${escapeHtml(location)}</p>
      </div>
    `, { closeButton: false, className: 'gem-popup-shell' }).openPopup();

    map.setView([latitude, longitude], 10);
  }

  function buildOpenStreetMapDirectionsUrl(origin, destination) {
    const params = new URLSearchParams({
      engine: 'fossgis_osrm_car',
      route: `${origin.latitude},${origin.longitude};${destination.latitude},${destination.longitude}`,
    });

    return `https://www.openstreetmap.org/directions?${params.toString()}#map=11/${destination.latitude}/${destination.longitude}`;
  }

  function wireDirections() {
    document.querySelectorAll('[data-directions]').forEach((directions) => {
      const button = directions.querySelector('[data-directions-button]');
      const status = directions.querySelector('[data-directions-status]');
      const latitude = Number.parseFloat(directions.dataset.latitude || '');
      const longitude = Number.parseFloat(directions.dataset.longitude || '');

      if (!button || !status || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return;
      }

      button.addEventListener('click', () => {
        if (!('geolocation' in navigator)) {
          status.textContent = 'Your browser cannot read your current location.';
          return;
        }

        button.disabled = true;
        status.textContent = 'Getting your location...';

        navigator.geolocation.getCurrentPosition((position) => {
          const directionsUrl = buildOpenStreetMapDirectionsUrl({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }, {
            latitude,
            longitude,
          });

          status.textContent = 'Opening OpenStreetMap directions.';
          button.disabled = false;
          window.open(directionsUrl, '_blank', 'noopener,noreferrer');
        }, () => {
          status.textContent = 'Location access was not allowed. You can still open the place in OpenStreetMap.';
          button.disabled = false;
        }, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });
    });
  }

  function wireMaps() {
    const mapElements = document.querySelectorAll('[data-map-mode]');

    if (!mapElements.length) {
      return;
    }

    const render = async (element) => {
      try {
        if (element.dataset.mapMode === 'collection') {
          await renderCollectionMap(element);
          return;
        }

        await renderSingleDestinationMap(element);
      } catch (error) {
        hideMapShell(element);
      }
    };

    if (!('IntersectionObserver' in window)) {
      mapElements.forEach(render);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        observer.unobserve(entry.target);
        render(entry.target);
      });
    }, {
      rootMargin: '160px 0px',
    });

    mapElements.forEach((element) => observer.observe(element));
  }

  registerServiceWorker();
  wireDeleteConfirmation();
  wireTextareas();
  wireImagePreview();
  wireMaps();
  wireDirections();
});
