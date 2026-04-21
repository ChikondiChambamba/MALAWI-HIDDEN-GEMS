document.addEventListener('DOMContentLoaded', () => {
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
        if (!window.confirm('Are you sure you want to delete this post?')) {
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

    if (!imageInput || !imagePreview || !imagePreviewTag) {
      return;
    }

    imageInput.addEventListener('change', (event) => {
      const [file] = event.target.files;

      if (!file) {
        imagePreview.setAttribute('aria-hidden', 'true');
        imagePreviewTag.classList.add('hidden');
        imagePreviewTag.removeAttribute('src');
        return;
      }

      imagePreviewTag.src = URL.createObjectURL(file);
      imagePreviewTag.classList.remove('hidden');
      imagePreview.setAttribute('aria-hidden', 'false');
    });
  }

  function loadLeaflet() {
    if (window.L) {
      return Promise.resolve(window.L);
    }

    return Promise.reject(new Error('Leaflet is not available on the page.'));
  }

  function buildTileLayer(L) {
    return L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 18,
    });
  }

  function buildPopup(destination) {
    const tagMarkup = (destination.tags || [])
      .slice(0, 3)
      .map((tag) => `<span style="display:inline-block;margin:4px 6px 0 0;padding:4px 8px;border-radius:999px;background:#edf4ef;color:#305542;font-size:11px;">${tag.name}</span>`)
      .join('');

    return `
      <div style="width:220px;font-family:Manrope,sans-serif;">
        <img src="${destination.imageUrl}" alt="${destination.title}" style="width:100%;height:120px;object-fit:cover;border-radius:14px;margin-bottom:10px;" loading="lazy">
        <div style="font-size:15px;font-weight:700;color:#182128;">${destination.title}</div>
        <div style="margin-top:4px;color:#416f58;font-size:13px;">${destination.location || 'Malawi'}</div>
        <div style="margin-top:6px;">${tagMarkup}</div>
        <a href="${destination.url}" style="display:inline-block;margin-top:12px;color:#305542;font-size:13px;font-weight:700;text-decoration:none;">View destination</a>
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
    const data = await response.json();
    const destinations = (data.destinations || []).filter((destination) => (
      typeof destination.latitude === 'number' && typeof destination.longitude === 'number'
    ));

    if (!destinations.length) {
      element.closest('[data-map-shell]')?.classList.add('hidden');
      return;
    }

    const L = await loadLeaflet();
    const map = createMap(L, element);
    const bounds = [];

    destinations.forEach((destination) => {
      const marker = L.circleMarker([destination.latitude, destination.longitude], {
        radius: destination.featured ? 8 : 6,
        weight: 2,
        color: destination.featured ? '#d86d3c' : '#305542',
        fillColor: destination.featured ? '#f0ab8c' : '#4f7a64',
        fillOpacity: 0.92,
      }).addTo(map);

      marker.bindPopup(buildPopup(destination), {
        closeButton: false,
        className: 'destination-popup',
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
      element.closest('[data-map-shell]')?.classList.add('hidden');
      return;
    }

    const L = await loadLeaflet();
    const map = createMap(L, element);
    const title = element.dataset.title || 'Destination';
    const location = element.dataset.location || 'Malawi';

    L.circleMarker([latitude, longitude], {
      radius: 8,
      weight: 2,
      color: '#d86d3c',
      fillColor: '#f8b395',
      fillOpacity: 0.95,
    }).addTo(map).bindPopup(`
      <div style="font-family:Manrope,sans-serif;">
        <strong style="display:block;color:#182128;">${title}</strong>
        <span style="color:#416f58;font-size:13px;">${location}</span>
      </div>
    `).openPopup();

    map.setView([latitude, longitude], 10);
  }

  function wireMaps() {
    const mapElements = document.querySelectorAll('[data-map-mode]');

    if (!mapElements.length) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const element = entry.target;
        observer.unobserve(element);

        try {
          if (element.dataset.mapMode === 'collection') {
            await renderCollectionMap(element);
            return;
          }

          await renderSingleDestinationMap(element);
        } catch (error) {
          element.closest('[data-map-shell]')?.classList.add('hidden');
        }
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
});
