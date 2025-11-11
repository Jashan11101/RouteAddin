let map, directionsService, directionsRenderer;
let stops = [];

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const selectedText = params.get("text") || "";

  document.getElementById("closeBtn").onclick = () => {
    parent.postMessage("closePanel", "*");
  };

  document.getElementById("addStopBtn").onclick = () => addStop("");
  document.getElementById("calcBtn").onclick = calculateRoute;
  document.getElementById("shareBtn").onclick = shareRoute;
  document.getElementById("saveBtn").onclick = saveRoute;

  initMap();

  if (selectedText) {
    stops = selectedText.split(/\s*,\s*|\s*to\s*|\s*-\s*/i).filter(x => x);
    renderStops();
  }
};

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 43.65, lng: -79.38 },
    zoom: 6
  });
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });
}

function renderStops() {
  const container = document.getElementById("locations");
  container.innerHTML = "";
  stops.forEach((stop, i) => {
    const input = document.createElement("input");
    input.value = stop;
    input.className = "location-input";
    input.placeholder = `Stop ${i + 1}`;
    input.oninput = e => stops[i] = e.target.value;
    container.appendChild(input);
  });
}

function addStop(val = "") {
  stops.push(val);
  renderStops();
}

function calculateRoute() {
  if (stops.length < 2) return alert("Need at least 2 stops.");

  const waypoints = stops.slice(1, -1).map(loc => ({ location: loc, stopover: true }));
  directionsService.route(
    {
      origin: stops[0],
      destination: stops[stops.length - 1],
      waypoints,
      travelMode: "DRIVING"
    },
    (result, status) => {
      if (status === "OK") {
        directionsRenderer.setDirections(result);
        const route = result.routes[0].legs;
        let totalMiles = 0;
        route.forEach(r => totalMiles += r.distance.value / 1609.34);
        const rateCAD = totalMiles * 3.5;
        const rateUSD = rateCAD * 0.74;

        alert(`Total Miles: ${totalMiles.toFixed(1)}\nRate: ${rateCAD.toFixed(2)} CAD (${rateUSD.toFixed(2)} USD)`);
      } else {
        alert("Route not found: " + status);
      }
    }
  );
}

function shareRoute() {
  const routeText = stops.join(" → ");
  const shareData = {
    title: "Route Details",
    text: `Route: ${routeText}`,
    url: location.href
  };
  if (navigator.share) {
    navigator.share(shareData).catch(console.error);
  } else {
    alert("Sharing not supported on this device.");
  }
}

function saveRoute() {
  const key = "route_" + Date.now();
  chrome.storage.local.set({ [key]: stops }, () => {
    alert("Route saved to this email.");
  });
}
