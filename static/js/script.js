// Chart instances
let phChart = null;
let ammoniaChart = null;
let oxygenChart = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Pond Dashboard Initialized');

    // Modal Close Logic
    const modal = document.getElementById('detailsModal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.onclick = function () {
        modal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    // Check saved theme
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');

        localStorage.setItem('theme', isLight ? 'light' : 'dark');

        if (isLight) {
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    });

    // Mobile Menu Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('overlay');

    function toggleMenu() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }
});

function showDetails(metrics, pondName) {
    const modal = document.getElementById('detailsModal');
    document.getElementById('modalTitle').textContent = `Live Analysis: ${pondName}`;
    modal.style.display = "block";

    // Destroy previous charts if they exist
    if (phChart) phChart.destroy();
    if (ammoniaChart) ammoniaChart.destroy();
    if (oxygenChart) oxygenChart.destroy();

    // Common Chart Options
    const commonOptions = {
        responsive: true,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                ticks: { color: '#94a3b8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#94a3b8' }
            }
        }
    };

    // Generate last 7 days dates
    const timeLabels = getLast7Days();

    // Create new charts
    phChart = createChart('phChart', 'pH Level', timeLabels, metrics.ph, '#0ea5e9', commonOptions);
    ammoniaChart = createChart('ammoniaChart', 'Ammonia', timeLabels, metrics.ammonia, '#f43f5e', commonOptions);
    oxygenChart = createChart('oxygenChart', 'Oxygen', timeLabels, metrics.oxygen, '#22c55e', commonOptions);
}

function createChart(canvasId, label, labels, data, color, options) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: gradient,
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#1e293b',
                pointBorderColor: color,
                pointBorderWidth: 2
            }]
        },
        options: options
    });
}

function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
}

// Real Map (Leaflet) Logic - Advanced Optimizer
let map = null;
let currentMode = 'boundary'; // 'boundary' or 'nodes'
let boundaryPoints = JSON.parse(localStorage.getItem('pond_boundary') || '[]');
let boundaryMarkers = [];
let boundaryPolygon = null;
let nodeMarkers = [];
let nodeData = JSON.parse(localStorage.getItem('pond_nodes') || '[]');
let gatewayMarker = null;
let connectionLines = []; // Lines from nodes to gateway

function initPondVisualizer() {
    const mapDiv = document.getElementById('map-container');
    if (!mapDiv) return;

    // Initialize Map
    if (map !== null) {
        map.remove();
        map = null;
    }
    map = L.map('map-container').setView([23.8103, 90.4125], 16);

    // Satellite Imagery
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri'
    }).addTo(map);

    // Load persisted data
    if (boundaryPoints.length > 0) {
        boundaryPoints.forEach(p => {
            const m = L.circleMarker(p, { radius: 4, fillColor: "#0ea5e9", color: "#fff", weight: 1, fillOpacity: 1 }).addTo(map);
            boundaryMarkers.push(m);
        });
        rebuildPolygon();
    }

    if (nodeData.length > 0) {
        nodeData.forEach(p => addNodeMarker(p[0], p[1], false));
    }

    // UI Elements
    const searchInput = document.getElementById('location-search');
    const searchBtn = document.getElementById('search-btn');
    const modeBtns = document.querySelectorAll('.mode-btn');
    const undoBtn = document.getElementById('undo-btn'); // Undo button
    const clearBtn = document.getElementById('clear-mode-data');
    const resetAllBtn = document.getElementById('reset-all');
    const statusDisplay = document.getElementById('status-display');

    // Search Logic
    searchBtn.addEventListener('click', async () => {
        const query = searchInput.value;
        if (!query) return;
        searchBtn.textContent = "Searching...";
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await resp.json();
            if (data.length > 0) map.setView([data[0].lat, data[0].lon], 18);
        } catch (e) { console.error(e); }
        finally { searchBtn.textContent = "Search & Jump"; }
    });

    // Mode Switching
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMode = btn.dataset.mode;

            // UI Feedback
            statusDisplay.textContent = `Mode: ${currentMode === 'boundary' ? 'Set Bank' : 'Place Nodes'}`;
            document.getElementById('instr-boundary').style.display = currentMode === 'boundary' ? 'block' : 'none';
            document.getElementById('instr-nodes').style.display = currentMode === 'nodes' ? 'block' : 'none';

            // Toggle Undo Button visibility
            if (currentMode === 'boundary') {
                undoBtn.style.display = 'inline-block';
            } else {
                undoBtn.style.display = 'none';
            }
        });
    });

    // Map Interaction
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        if (currentMode === 'boundary') {
            addBoundaryPoint(lat, lng);
        } else if (currentMode === 'nodes') {
            if (!boundaryPolygon) {
                alert("Please define the pond boundary (Bank) first!");
                return;
            }
            addNodeMarker(lat, lng);
        }
    });

    function addBoundaryPoint(lat, lng) {
        boundaryPoints.push([lat, lng]);
        localStorage.setItem('pond_boundary', JSON.stringify(boundaryPoints));

        const marker = L.circleMarker([lat, lng], {
            radius: 5,
            fillColor: "#0ea5e9",
            color: "#fff",
            weight: 2,
            fillOpacity: 1,
            className: 'corner-marker'
        }).addTo(map);
        boundaryMarkers.push(marker);

        rebuildPolygon();
        updateVisuals();
    }

    function rebuildPolygon() {
        if (boundaryPolygon) map.removeLayer(boundaryPolygon);
        if (boundaryPoints.length >= 2) {
            boundaryPolygon = L.polygon(boundaryPoints, {
                color: '#0ea5e9',
                fillColor: '#0ea5e9',
                fillOpacity: 0.2,
                weight: 3
            }).addTo(map);
        }
    }

    function addNodeMarker(lat, lng, persist = true) {
        const marker = L.marker([lat, lng], {
            draggable: true,
            icon: L.divIcon({
                className: 'sensor-icon',
                html: `<div class="sensor-icon-dot"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })
        }).addTo(map);

        nodeMarkers.push(marker);

        if (persist) {
            const currentNodes = nodeMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
            localStorage.setItem('pond_nodes', JSON.stringify(currentNodes));
        }

        marker.on('drag', () => {
            const currentNodes = nodeMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
            localStorage.setItem('pond_nodes', JSON.stringify(currentNodes));
            updateVisuals();
        });

        marker.on('dblclick', () => {
            map.removeLayer(marker);
            nodeMarkers = nodeMarkers.filter(m => m !== marker);
            const currentNodes = nodeMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
            localStorage.setItem('pond_nodes', JSON.stringify(currentNodes));
            updateVisuals();
        });

        updateVisuals();
    }

    // Undo Logic
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (currentMode === 'boundary' && boundaryPoints.length > 0) {
                // Remove last data point
                boundaryPoints.pop();
                localStorage.setItem('pond_boundary', JSON.stringify(boundaryPoints));

                // Remove last marker
                const lastMarker = boundaryMarkers.pop();
                if (lastMarker) map.removeLayer(lastMarker);

                rebuildPolygon();
                updateVisuals();
            }
        });
    }

    function updateVisuals() {
        const nodeCount = nodeMarkers.length;
        document.getElementById('points-count').textContent = `Sensors: ${nodeCount}`;
        const resultBox = document.getElementById('result-box');
        const resultCoords = document.getElementById('result-coords');

        // Clear previous connection lines
        connectionLines.forEach(line => map.removeLayer(line));
        connectionLines = [];

        // Need at least 3 points for a boundary and 1 node for gateway
        if (nodeCount === 0 || boundaryPoints.length < 3) {
            if (gatewayMarker) map.removeLayer(gatewayMarker);
            gatewayMarker = null;
            document.getElementById('optimal-location').textContent = `Centroid: --`;
            if (resultBox) resultBox.classList.remove('visible');
            return;
        }

        // Calculate Centroid of Nodes
        const avgLat = nodeMarkers.reduce((acc, m) => acc + m.getLatLng().lat, 0) / nodeCount;
        const avgLng = nodeMarkers.reduce((acc, m) => acc + m.getLatLng().lng, 0) / nodeCount;

        // Project Centroid to Nearest Polygon Edge
        const bankPoint = getNearestPointOnPolygon([avgLat, avgLng], boundaryPoints);

        // Update Gateway Marker
        if (gatewayMarker) {
            gatewayMarker.setLatLng(bankPoint);
        } else {
            gatewayMarker = L.marker(bankPoint, {
                icon: L.divIcon({
                    className: 'gateway-icon',
                    html: `<div class="gateway-icon-wrapper"><i class="fa-solid fa-tower-broadcast"></i></div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                }),
                zIndexOffset: 1000
            }).addTo(map);
            gatewayMarker.bindPopup("<b>Mother Gateway</b><br>Setup point on the bank").openPopup();
        }

        // Draw connecting lines for visual feedback
        nodeMarkers.forEach(m => {
            const line = L.polyline([m.getLatLng(), bankPoint], {
                color: '#22c55e',
                weight: 2,
                dashArray: '5, 10',
                opacity: 0.5
            }).addTo(map);
            connectionLines.push(line);
        });

        // UI Updates
        document.getElementById('optimal-location').textContent = `Bank Location Found!`;
        if (resultBox) resultBox.classList.add('visible');
        if (resultCoords) resultCoords.textContent = `${bankPoint[0].toFixed(6)}, ${bankPoint[1].toFixed(6)}`;
    }

    // Helper: Reset current phase
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            try {
                if (currentMode === 'boundary') {
                    if (boundaryPolygon) { map.removeLayer(boundaryPolygon); boundaryPolygon = null; }
                    boundaryMarkers.forEach(m => map.removeLayer(m));
                    boundaryPoints = [];
                    boundaryMarkers = [];
                    localStorage.removeItem('pond_boundary');
                } else {
                    nodeMarkers.forEach(m => map.removeLayer(m));
                    nodeMarkers = [];
                    localStorage.removeItem('pond_nodes');
                }
                updateVisuals();
                // If we cleared boundary, we must clear nodes too to maintain consistency
                if (currentMode === 'boundary') {
                    nodeMarkers.forEach(m => map.removeLayer(m));
                    nodeMarkers = [];
                    localStorage.removeItem('pond_nodes');
                }
            } catch (e) {
                console.error("Error clearing phase:", e);
            }
        });
    }

    // Helper: Reset all
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to reset everything?")) {
                localStorage.removeItem('pond_boundary');
                localStorage.removeItem('pond_nodes');
                location.reload(); // Force reload to clear all state and map artifacts
            }
        });
    } else {
        console.error("Reset All Button not found!");
    }
}

// Math Helpers
function isPointInPolygon(point, vs) {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

function getNearestPointOnPolygon(point, poly) {
    let minSquareDist = Infinity;
    let nearestPoint = poly[0];

    for (let i = 0; i < poly.length; i++) {
        const p1 = poly[i];
        const p2 = poly[(i + 1) % poly.length];

        const proj = getNearestPointOnSegment(point, p1, p2);
        const distSq = Math.pow(point[0] - proj[0], 2) + Math.pow(point[1] - proj[1], 2);

        if (distSq < minSquareDist) {
            minSquareDist = distSq;
            nearestPoint = proj;
        }
    }
    return nearestPoint;
}

function getNearestPointOnSegment(p, a, b) {
    const atob = [b[0] - a[0], b[1] - a[1]];
    const atop = [p[0] - a[0], p[1] - a[1]];
    const lenSq = atob[0] * atob[0] + atob[1] * atob[1];

    // Check for zero-length segment
    if (lenSq === 0) return a;

    let dot = atop[0] * atob[0] + atop[1] * atob[1];
    const t = Math.min(1, Math.max(0, dot / lenSq));
    return [a[0] + atob[0] * t, a[1] + atob[1] * t];
}

document.addEventListener('DOMContentLoaded', () => {
    initPondVisualizer();
});
