// Clean Taiwan dashboard JS
// Responsibilities: load sample/API data, initialize map + markers, wire charts, update UI on city select

let map;
const markers = {};
const charts = {};

// Small sample CITY_DATA used to display immediate values. It may be replaced by API-processed data.
// Updated to include Hualien and Pingtung (user requested) and use the project's city color palette.
const CITY_DATA = {
    Taipei: { aqi: 45, pm25: 15, pm10: 38, o3: 52, no2: 15, so2: 3, co: 0.5, windSpeed: 3.5, temp: 26, humidity: 65 },
    Taichung: { aqi: 55, pm25: 18, pm10: 40, o3: 55, no2: 16, so2: 3, co: 0.6, windSpeed: 3.8, temp: 25, humidity: 60 },
    Kaohsiung: { aqi: 75, pm25: 25, pm10: 45, o3: 65, no2: 20, so2: 4, co: 0.8, windSpeed: 4.2, temp: 28, humidity: 70 },
    Hualien: { aqi: 55, pm25: 18, pm10: 40, o3: 30, no2: 10, so2: 1, co: 0.3, windSpeed: 3.2, temp: 23, humidity: 65 },
    Pingtung: { aqi: 85, pm25: 30, pm10: 60, o3: 35, no2: 18, so2: 2, co: 0.4, windSpeed: 3.9, temp: 27, humidity: 78 }
};

// Use the exact color list requested by the user in this order
const CITY_META = [
    { id: 'Taipei', name: 'Taipei', coords: [121.525, 25.033], color: '#8C79FF' },
    { id: 'Taichung', name: 'Taichung', coords: [120.6736, 24.1477], color: '#5FC3FF' },
    { id: 'Kaohsiung', name: 'Kaohsiung', coords: [120.487, 22.551], color: '#F5B96B' },
    { id: 'Hualien', name: 'Hualien', coords: [121.607, 23.976], color: '#39C96A' },
    { id: 'Pingtung', name: 'Pingtung', coords: [120.666, 22.627], color: '#EB898C' }
];

// Mapbox token (keep existing token or replace with your own)
mapboxgl.accessToken = 'pk.eyJ1IjoiYmlhYm9ibyIsImEiOiJjamVvejdlNXQxZnBuMndtdWhiZHRuaTNpIn0.PIS9wtUxm_rz_IzF2WFD1g';

// SAMPLE_DATA_OBJ holds parsed sample JSON with the structure used in the repo's sample file.
// Sample data for 7 days
const SAMPLE_DATA_OBJ = {
    Taipei: {
        temperature: {
            weekly: [24, 25, 26, 25, 24, 26, 25],
            current: 25
        },
        humidity: {
            weekly: [70, 65, 60, 68, 72, 65, 63],
            current: 65
        }
    },
    Taichung: {
        temperature: {
            weekly: [26, 27, 25, 26, 28, 27, 25],
            current: 25
        },
        humidity: {
            weekly: [65, 62, 60, 63, 68, 64, 60],
            current: 60
        }
    },
    Kaohsiung: {
        temperature: {
            weekly: [28, 29, 28, 27, 29, 30, 28],
            current: 28
        },
        humidity: {
            weekly: [75, 72, 70, 73, 68, 70, 72],
            current: 70
        }
    },
    Hualien: {
        temperature: {
            weekly: [23, 24, 23, 22, 24, 25, 23],
            current: 23
        },
        humidity: {
            weekly: [68, 65, 67, 70, 65, 63, 65],
            current: 65
        }
    },
    Pingtung: {
        temperature: {
            weekly: [27, 28, 27, 26, 28, 29, 27],
            current: 27
        },
        humidity: {
            weekly: [80, 78, 75, 77, 79, 76, 78],
            current: 78
        }
    }
};

async function loadSampleData() {
    // Using static sample data instead of fetching
    console.log('Sample data loaded:', SAMPLE_DATA_OBJ);
}

function initDashboard() {
    // Load sample data, then init map & charts
    loadSampleData().then(() => {
            initMap();
            initCharts();
            // No automatic city selection (user requested). Wait for user click.
            setInterval(updateCurrentTime, 60000);
            updateCurrentTime();
    });
}

function initMap() {
    // Create a 2D Mapbox map (no globe auto-rotation)
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [120.971, 23.801],
        zoom: 7,
        pitch: 0,
        bearing: 0,
        projection: 'mercator',
        attributionControl: false
    });

    // Add navigation (zoom) control
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    // Ensure interactive controls are set; disable scroll by default so the page scroll works
    map.once('load', () => {
        map.scrollZoom.disable(); // enable only when user hovers map
        map.boxZoom.enable();
        map.dragPan.enable();
        map.dragRotate.disable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.disable();
    });

    // Create markers (do this once map is ready)
    CITY_META.forEach(city => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = city.color;
        el.dataset.city = city.id;

        // tooltip label inside marker (CSS shows on hover)
        const tip = document.createElement('div');
        tip.className = 'marker-tooltip';
        tip.textContent = city.name;
        el.appendChild(tip);

        const mk = new mapboxgl.Marker({ element: el })
            .setLngLat(city.coords)
            .addTo(map);

        // click handler
        el.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const id = el.dataset.city;
            // visual active state
            document.querySelectorAll('.marker').forEach(m => m.classList.remove('active'));
            el.classList.add('active');
            // update UI
            selectCity(id);
            map.flyTo({ center: city.coords, zoom: 9, duration: 800 });
        });

        markers[city.id] = { el, marker: mk, meta: city };
    });

    // While hovering the map we want the mouse wheel to zoom the map and not scroll the page.
    // Enable map scrollZoom and touch gestures on mouseenter, disable on mouseleave.
    const canvas = map.getCanvas();
    function preventPageScroll(e) { e.preventDefault(); return false; }

    canvas.addEventListener('mouseenter', () => {
        // enable map zooming
        try { map.scrollZoom.enable(); } catch (e) {}
        try { map.touchZoomRotate.enable(); } catch (e) {}
        // prevent the document from scrolling while pointer is over the map
        document.body.style.overflow = 'hidden';
        // prevent wheel default to ensure consistent behavior across browsers
        window.addEventListener('wheel', preventPageScroll, { passive: false });
    });

    canvas.addEventListener('mouseleave', () => {
        try { map.scrollZoom.disable(); } catch (e) {}
        try { map.touchZoomRotate.disable(); } catch (e) {}
        document.body.style.overflow = '';
        try { window.removeEventListener('wheel', preventPageScroll, { passive: false }); } catch (e) { window.removeEventListener('wheel', preventPageScroll); }
    });
}

function updateCurrentTime() {
    const el = document.getElementById('currentTime');
    if (el) el.textContent = new Date().toLocaleString();
}

function selectCity(id) {
    console.log('selectCity called for:', id);
    const cityKey = id;

    // Prefer processed CITY_DATA values; fallback to sample file's structure
    const cd = CITY_DATA[cityKey] || {};
    const sample = SAMPLE_DATA_OBJ[cityKey] || {};

    // merge (sample overrides CITY_DATA where present)
    const data = { ...cd, ...sample };

    // AQI
    const aqiEl = document.getElementById('currentAQI');
    const aqiStatusEl = document.getElementById('aqiStatus');
    const aqiVal = data.aqi ?? data.AQI ?? 0;
    if (aqiEl) {
        aqiEl.textContent = aqiVal;
        aqiEl.className = 'aqi-number';
        if (aqiVal <= 50) aqiEl.classList.add('good');
        else if (aqiVal <= 100) aqiEl.classList.add('moderate');
        else aqiEl.classList.add('unhealthy');
    }
    if (aqiStatusEl) {
        if (aqiVal <= 50) aqiStatusEl.textContent = 'Good Air Quality';
        else if (aqiVal <= 100) aqiStatusEl.textContent = 'Moderate Air Quality';
        else aqiStatusEl.textContent = 'Unhealthy Air Quality';
    }

    // Left small boxes
    const leftTemp = document.getElementById('leftTemp');
    const leftHumidity = document.getElementById('leftHumidity');
    if (leftTemp) leftTemp.textContent = (data.temperature?.current ?? data.temp ?? data.TEMP ?? 0) + '°C';
    if (leftHumidity) leftHumidity.textContent = (data.humidity?.current ?? data.humidity ?? data.HUMIDITY ?? 0) + '%';

    // Pollutant pie chart
    if (charts.pollutantPie) {
        const p25 = data.pollutants?.pm25 ?? data.pm25 ?? data.pm2_5 ?? 0;
        const p10 = data.pollutants?.pm10 ?? data.pm10 ?? 0;
        const o3 = data.pollutants?.o3 ?? data.o3 ?? 0;
        const no2 = data.pollutants?.no2 ?? data.no2 ?? 0;
        const so2 = data.pollutants?.so2 ?? data.so2 ?? 0;
        const co = data.pollutants?.co ?? data.co ?? 0;
        charts.pollutantPie.data.datasets[0].data = [p25, p10, o3, no2, so2, co];
        charts.pollutantPie.update();
    }

    // Weekly temp/humidity chart
    if (charts.tempWeek) updateWeekTempHumidityChart(cityKey);
}

function initCharts() {
    // Chart defaults
    Chart.defaults.color = '#222';
    Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";

    // temp compare (simple horizontal bar)
    const tCtx = document.getElementById('tempCompareChart')?.getContext('2d');
    if (tCtx) {
        charts.tempCompare = new Chart(tCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(CITY_DATA),
                datasets: [{ label: 'Temp (°C)', data: Object.values(CITY_DATA).map(c => c.temp), backgroundColor: CITY_META.map(city => city.color) }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // tempWeek
    const tw = document.getElementById('tempWeekChart')?.getContext('2d');
    if (tw) {
        charts.tempWeek = new Chart(tw, {
            type: 'line',
            data: { 
                labels: [], 
                datasets: [
                    { 
                        label: 'Temperature (°C)', 
                        data: [], 
                        borderColor: '#f36', 
                        tension: 0.4,
                        fill: false,
                        cubicInterpolationMode: 'monotone',
                        yAxisID: 'y'
                    }, 
                    { 
                        label: 'Humidity (%)', 
                        data: [], 
                        borderColor: '#39f', 
                        tension: 0.4,
                        fill: false,
                        cubicInterpolationMode: 'monotone',
                        yAxisID: 'y1'
                    }
                ] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Temperature (°C)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Humidity (%)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    // wind list/table (simple values per city, no chart colors)
    const windTable = document.getElementById('windTable');
    if (windTable && windTable.querySelector('tbody')) {
        const tbody = windTable.querySelector('tbody');
        tbody.innerHTML = '';
        CITY_META.forEach(city => {
            const speed = CITY_DATA[city.id]?.windSpeed ?? (SAMPLE_DATA_OBJ[city.id]?.windSpeed ?? '—');
            const tr = document.createElement('tr');
            const tdCity = document.createElement('td'); tdCity.textContent = city.name;
            const tdSpeed = document.createElement('td'); tdSpeed.textContent = (typeof speed === 'number') ? speed.toFixed(1) : speed;
            tr.appendChild(tdCity);
            tr.appendChild(tdSpeed);
            tbody.appendChild(tr);
        });
    }

    // pollutant pie
    const pctx = document.getElementById('pollutantPieChart')?.getContext('2d');
    if (pctx) {
        charts.pollutantPie = new Chart(pctx, { 
            type: 'doughnut', 
            data: { 
                labels: ['PM2.5','PM10','O₃','NO₂','SO₂','CO'], 
                datasets: [{ 
                    data: [15,38,52,15,3,0.5], 
                    backgroundColor: ['#8C79FF','#66C8FF','#F5B96B','#39C96A','#EB898C','#B0A8B9'],
                    spacing: 2
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            } 
        });
    }
}

function updateWeekTempHumidityChart(cityKey) {
    if (!charts.tempWeek) return;
    const citySample = SAMPLE_DATA_OBJ[cityKey];
    let labels = [];
    let temps = [];
    let hums = [];
    if (citySample && citySample.temperature && Array.isArray(citySample.temperature.weekly)) {
        labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        temps = citySample.temperature.weekly;
        hums = citySample.humidity?.weekly || [];
    } else {
        // fallback: single current value
        labels = ['Now'];
        temps = [CITY_DATA[cityKey]?.temp ?? 0];
        hums = [CITY_DATA[cityKey]?.humidity ?? 0];
    }
    charts.tempWeek.data.labels = labels;
    charts.tempWeek.data.datasets[0].data = temps;
    charts.tempWeek.data.datasets[1].data = hums;
    charts.tempWeek.update();
}

// Start everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => initDashboard());