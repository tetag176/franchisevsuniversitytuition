// ---------- DATA ----------
const universityData = [
  {
    name: "The New School",
    tuition: 60240,
    starbucksShare: 33.3,
    indieShare: 66.7,
    neighborhood: "Arts / Design / Creative",
    lat: 40.7358,
    lng: -73.9995
  },
  {
    name: "FIT",
    tuition: 16470,
    starbucksShare: 68.0,
    indieShare: 32.0,
    neighborhood: "Fashion / Commercial Retail",
    lat: 40.7472,
    lng: -73.9946
  },
  {
    name: "The Cooper Union",
    tuition: 44550,
    starbucksShare: 85.7,
    indieShare: 14.3,
    neighborhood: "Commercial / Tech / Startup Revival Zone",
    lat: 40.7295,
    lng: -73.9903
  },
  {
    name: "Columbia",
    tuition: 71170,
    starbucksShare: 42.9,
    indieShare: 57.1,
    neighborhood: "Residential / Academic Upper-Class",
    lat: 40.8075,
    lng: -73.9626
  },
  {
    name: "Pratt Institute",
    tuition: 62214,
    starbucksShare: 16.7,
    indieShare: 83.3,
    neighborhood: "Local Arts Community / Neighborhood-Based",
    lat: 40.6914,
    lng: -73.964
  },
  {
    name: "Pace University",
    tuition: 52924,
    starbucksShare: 63.6,
    indieShare: 36.4,
    neighborhood: "Business District / Corporate Urban",
    lat: 40.7115,
    lng: -74.0049
  },
  {
    name: "Fordham (Bronx)",
    tuition: 65920,
    starbucksShare: 25.0,
    indieShare: 75.0,
    neighborhood: "Residential / Neighborhood Community",
    lat: 40.8612,
    lng: -73.8857
  },
  {
    name: "Hunter College",
    tuition: 18600,
    starbucksShare: 54.5,
    indieShare: 45.5,
    neighborhood: "Upper-Midtown Mix (Education + Retail)",
    lat: 40.7683,
    lng: -73.964
  },
  {
    name: "Baruch College",
    tuition: 14880,
    starbucksShare: 70.0,
    indieShare: 30.0,
    neighborhood: "Business / Corporate Midtown East",
    lat: 40.7403,
    lng: -73.9833
  },
  {
    name: "St. John’s University",
    tuition: 53980,
    starbucksShare: 33.3,
    indieShare: 66.7,
    neighborhood: "Suburban / Campus-Centered",
    lat: 40.7217,
    lng: -73.795
  }
];

const neighborhoodColors = {
  "Arts / Design / Creative": "#F4A259",
  "Fashion / Commercial Retail": "#D1495B",
  "Commercial / Tech / Startup Revival Zone": "#2E8B57",
  "Residential / Academic Upper-Class": "#4A90E2",
  "Local Arts Community / Neighborhood-Based": "#F1C453",
  "Business District / Corporate Urban": "#1B6542",
  "Residential / Neighborhood Community": "#E76F51",
  "Upper-Midtown Mix (Education + Retail)": "#A593E0",
  "Business / Corporate Midtown East": "#2A9D8F",
  "Suburban / Campus-Centered": "#A0A0A0"
};

const neighborhoodGroups = {
  business: [
    "Business District / Corporate Urban",
    "Business / Corporate Midtown East",
    "Fashion / Commercial Retail",
    "Commercial / Tech / Startup Revival Zone",
    "Upper-Midtown Mix (Education + Retail)"
  ],
  arts: [
    "Arts / Design / Creative",
    "Local Arts Community / Neighborhood-Based"
  ],
  residential: [
    "Residential / Academic Upper-Class",
    "Residential / Neighborhood Community",
    "Suburban / Campus-Centered"
  ]
};

// ---------- MAP ----------
let campusMap;
let campusMarkers = {}; // { [name]: { marker, el, uni } }
let campusBounds;
let mapFilter = "all";
let currentMapFocus = "overview";

function passesMapFilter(filterKey, uni) {
  if (!filterKey || filterKey === "all") return true;

  if (filterKey === "starbucks-heavy") {
    return uni.starbucksShare >= 60;
  }
  if (filterKey === "indie-heavy") {
    return uni.indieShare >= 60;
  }
  if (filterKey === "high-tuition") {
    return uni.tuition >= 55000;
  }
  if (filterKey === "low-tuition") {
    return uni.tuition <= 20000;
  }

  if (filterKey === "business" || filterKey === "arts" || filterKey === "residential") {
    const groups = neighborhoodGroups[filterKey];
    return groups && groups.includes(uni.neighborhood);
  }

  return true;
}

function buildMap() {
  const mapEl = document.getElementById("campusMap");
  if (!mapEl || typeof L === "undefined") return;

  campusMap = L.map(mapEl, {
    scrollWheelZoom: false,
    zoomControl: true
  }).setView([40.75, -73.98], 11);

  // dark tile layer
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors, ©Carto"
  }).addTo(campusMap);

  const bounds = [];

  universityData.forEach(u => {
    const color = neighborhoodColors[u.neighborhood] || "#22c55e";

    const iconHtml = `
      <div class="map-dot" style="--dot-color:${color}">
        <span class="map-dot-core" style="background:${color};"></span>
      </div>
    `;

    const icon = L.divIcon({
      className: "",
      html: iconHtml,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([u.lat, u.lng], { icon }).addTo(campusMap);

    const popupHtml = `
      <div style="font-size:12px;">
        <strong>${u.name}</strong><br/>
        Tuition: $${u.tuition.toLocaleString("en-US")}<br/>
        Starbucks share: ${u.starbucksShare.toFixed(1)}%<br/>
        Indie share: ${u.indieShare.toFixed(1)}%<br/>
        <span style="color:#9ca3af;">${u.neighborhood}</span>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on("add", () => {
      const el = marker.getElement();
      if (el) {
        campusMarkers[u.name] = {
          marker,
          el: el.querySelector(".map-dot"),
          uni: u
        };
      }
    });

    bounds.push([u.lat, u.lng]);
  });

  campusBounds = L.latLngBounds(bounds);
  campusMap.fitBounds(campusBounds, { padding: [60, 60] });

  // Map filter buttons
  const mapFilters = document.querySelectorAll(".map-filter");
  mapFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      mapFilters.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      mapFilter = btn.dataset.mapFilter || "all";
      applyMapFilterDim();
      applyMapFilterBounds();
      highlightMap(currentMapFocus);
    });
  });

  // Initial dim state
  applyMapFilterDim();
}

function applyMapFilterDim() {
  Object.values(campusMarkers).forEach(({ el, uni }) => {
    if (!el) return;
    el.classList.remove("map-dot--dim");
    if (!passesMapFilter(mapFilter, uni)) {
      el.classList.add("map-dot--dim");
    }
  });
}

function applyMapFilterBounds() {
  if (!campusMap || !campusBounds) return;

  if (!mapFilter || mapFilter === "all") {
    campusMap.fitBounds(campusBounds, { padding: [60, 60] });
    return;
  }

  const coords = universityData
    .filter(u => passesMapFilter(mapFilter, u))
    .map(u => [u.lat, u.lng]);

  if (coords.length > 0) {
    const bounds = L.latLngBounds(coords);
    campusMap.fitBounds(bounds, { padding: [70, 70] });
  }
}

function highlightMap(focusName) {
  if (!campusMap || !campusMarkers) return;
  currentMapFocus = focusName;

  // reset highlights
  Object.values(campusMarkers).forEach(({ el }) => {
    if (!el) return;
    el.classList.remove("map-dot--highlight");
  });

  if (!focusName || focusName === "overview") {
    applyMapFilterDim();
    applyMapFilterBounds();
    Object.values(campusMarkers).forEach(({ marker }) => marker.closePopup());
    return;
  }

  if (focusName === "summary") {
    // just zoom out to filtered area and let user explore
    applyMapFilterBounds();
    return;
  }

  const entry = campusMarkers[focusName];
  if (!entry) return;

  const { marker, el, uni } = entry;
  const latLng = marker.getLatLng();

  // apply filter dim state first
  applyMapFilterDim();

  // then highlight this one point
  if (el) {
    el.classList.remove("map-dot--dim");
    el.classList.add("map-dot--highlight");
  }

  campusMap.flyTo(latLng, 16, {
    duration: 1.1
  });

  // open popup after small delay so it's visible post-fly
  setTimeout(() => {
    marker.openPopup();
  }, 900);
}

// ---------- CHARTS ----------
let scatterChart;
let barChart;
let scatterFilter = "all";
let currentScatterFocus = "overview";

function buildScatterChart() {
  const ctx = document.getElementById("scatterChart");
  if (!ctx) return;

  const dataPoints = universityData.map(u => ({
    x: u.tuition,
    y: u.starbucksShare,
    university: u.name,
    neighborhood: u.neighborhood
  }));

  scatterChart = new Chart(ctx.getContext("2d"), {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Universities",
          data: dataPoints,
          backgroundColor: dataPoints.map(
            d => neighborhoodColors[d.neighborhood] || "#006241"
          ),
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBorderWidth: 0,
          pointHoverBorderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => {
              const d = context.raw;
              return [
                d.university,
                `Tuition: $${d.x.toLocaleString("en-US")}`,
                `Starbucks share: ${d.y.toFixed(1)}%`,
                `Neighborhood: ${d.neighborhood}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Tuition (USD)" },
          ticks: {
            callback: (value) => `$${value.toLocaleString("en-US")}`
          },
          grid: { color: "rgba(255,255,255,0.06)" }
        },
        y: {
          title: { display: true, text: "Starbucks share (%)" },
          min: 0,
          max: 100,
          ticks: {
            callback: (value) => `${value}%`
          },
          grid: { color: "rgba(255,255,255,0.06)" }
        }
      }
    }
  });

  // Scatter filter buttons
  const scatterFilters = document.querySelectorAll(".scatter-filter");
  scatterFilters.forEach(btn => {
    btn.addEventListener("click", () => {
      scatterFilters.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      scatterFilter = btn.dataset.scatterFilter || "all";
      highlightScatter(currentScatterFocus);
    });
  });
}

function buildBarChart() {
  const ctx = document.getElementById("barChart");
  if (!ctx) return;

  const labels = universityData.map(u => u.name);
  const starbucksShares = universityData.map(u => u.starbucksShare);
  const indieShares = universityData.map(u => u.indieShare);

  barChart = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Starbucks share (%)",
          data: starbucksShares,
          backgroundColor: "#058896",
          stack: "cafes"
        },
        {
          label: "Independent cafés share (%)",
          data: indieShares,
          backgroundColor: "#f2b90f",
          stack: "cafes"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "#f9fafb"
          }
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: "#e5e7eb", maxRotation: 40, minRotation: 40 },
          grid: { display: false }
        },
        y: {
          stacked: true,
          title: { display: true, text: "Café market share (%)", color: "#e5e7eb" },
          min: 0,
          max: 100,
          ticks: {
            color: "#e5e7eb",
            callback: (value) => `${value}%`
          },
          grid: { color: "rgba(255,255,255,0.06)" }
        }
      }
    }
  });
}

// ---------- SCATTER HIGHLIGHT / FILTER ----------

function highlightScatter(focusName) {
  if (!scatterChart) return;
  currentScatterFocus = focusName;

  const ds = scatterChart.data.datasets[0];

  // base: color by neighborhood
  ds.backgroundColor = ds.data.map(d =>
    neighborhoodColors[d.neighborhood] || "#006241"
  );
  ds.pointRadius = ds.data.map(() => 5);
  ds.pointBorderWidth = ds.data.map(() => 0);

  // apply dimming by neighborhood group
  if (scatterFilter !== "all" && neighborhoodGroups[scatterFilter]) {
    const allowed = neighborhoodGroups[scatterFilter];
    ds.data.forEach((d, i) => {
      const inGroup = allowed.includes(d.neighborhood);
      if (!inGroup) {
        ds.backgroundColor[i] = "rgba(120,140,150,0.18)";
        ds.pointRadius[i] = 2;
      }
    });
  }

  // no single highlight
  if (
    !focusName ||
    focusName === "overview" ||
    focusName === "summary" ||
    focusName === "neighborhoods"
  ) {
    scatterChart.update("active");
    return;
  }

  // dramatic highlight for one campus
  ds.data.forEach((d, i) => {
    if (d.university === focusName) {
      ds.pointRadius[i] = 12;
      ds.pointBorderWidth[i] = 3;
      ds.backgroundColor[i] = "#ffffff";
    } else {
      ds.pointRadius[i] = 2.5;
      ds.backgroundColor[i] = "rgba(120,140,150,0.18)";
    }
  });

  scatterChart.update("active");
}

// ---------- BAR HIGHLIGHT ----------

function highlightBars(focusName) {
  if (!barChart) return;
  const labels = barChart.data.labels;
  const sb = barChart.data.datasets[0];
  const indie = barChart.data.datasets[1];

  // reset all
  sb.backgroundColor = labels.map(() => "#058896");
  indie.backgroundColor = labels.map(() => "#f2b90f");
  sb.borderWidth = labels.map(() => 0);
  indie.borderWidth = labels.map(() => 0);

  if (!focusName || focusName === "overview" || focusName === "summary") {
    barChart.update("active");
    return;
  }

  labels.forEach((name, idx) => {
    if (name === focusName) {
      sb.backgroundColor[idx] = "#12c2a3";
      indie.backgroundColor[idx] = "#ffda5f";
      sb.borderWidth[idx] = 2;
      indie.borderWidth[idx] = 2;
    } else {
      sb.backgroundColor[idx] = "rgba(5,136,150,0.25)";
      indie.backgroundColor[idx] = "rgba(242,185,15,0.25)";
    }
  });

  barChart.update("active");
}

// ---------- MAP FILTER VISIBILITY ----------

function updateMapFiltersVisibility(focusName) {
  const filterWrapper = document.querySelector(".map-filters");
  if (!filterWrapper) return;

  if (focusName === "summary") {
    filterWrapper.classList.add("map-filters--visible");
  } else {
    filterWrapper.classList.remove("map-filters--visible");
  }
}

// ---------- SCROLL / INTERSECTION OBSERVER ----------

function setupScrolly() {
  const steps = document.querySelectorAll(".step");
  const scatterCard = document.querySelector(".viz-card--scatter");
  const barsCard = document.querySelector(".viz-card--bars");
  const mapWrapper = document.querySelector(".map-wrapper");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const chartType = el.dataset.chart;
        const focus = el.dataset.focus;

        // active style for text step
        steps.forEach(step => step.classList.remove("is-active"));
        el.classList.add("is-active");

        // reset zoom classes
        if (scatterCard) scatterCard.classList.remove("viz-card--zoomed");
        if (barsCard) barsCard.classList.remove("viz-card--zoomed");
        if (mapWrapper) mapWrapper.classList.remove("viz-card--zoomed");

        if (chartType === "scatter") {
          highlightScatter(focus);
          if (scatterCard) scatterCard.classList.add("viz-card--zoomed");
        } else if (chartType === "bars") {
          highlightBars(focus);
          if (barsCard) barsCard.classList.add("viz-card--zoomed");
        } else if (chartType === "map") {
          highlightMap(focus);
          updateMapFiltersVisibility(focus);
          if (mapWrapper) mapWrapper.classList.add("viz-card--zoomed");
        }
      });
    },
    {
      threshold: 0.6
    }
  );

  steps.forEach((step) => observer.observe(step));
}

// ---------- INIT ----------

window.addEventListener("DOMContentLoaded", () => {
  buildMap();
  buildScatterChart();
  buildBarChart();
  setupScrolly();

  // initial highlights
  highlightMap("overview");
  highlightScatter("overview");
  highlightBars("overview");
});
