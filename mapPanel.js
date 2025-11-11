let map, directionsService, directionsRenderer, stopsContainer;

document.addEventListener("DOMContentLoaded", async () => {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 5,
    center: { lat: 43.7, lng: -79.4 }, // default Toronto
    disableDefaultUI: false,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ map });

  stopsContainer = document.getElementById("stops");

  // Initial stop setup
  const params = new URLSearchParams(window.location.search);
  const text = params.get("text") || "";
  const guessed = smartSplit(text);
  guessed.forEach(addStop);

  document.getElementById("calcBtn").onclick = calculateRoute;
  document.getElementById("shareBtn").onclick = shareRoute;
  document.getElementById("saveBtn").onclick = saveRoute;

  initDragAndDrop();
  initAutoComplete();
});

function smartSplit(text) {
  // Try to detect cities from text like "Toronto to Chicago"
  const parts = text.split(/[-–—]| to /i).map(s => s.trim()).filter(Boolean);
  return parts.length >= 2 ? parts : [text];
}

function addStop(value = "") {
  const div = document.createElement("div");
  div.className = "stop";
  div.draggable = true;

  const input = document.createElement("input");
  input.placeholder = "Enter city...";
  input.value = value;

  const remove = document.createElement("button");
  remove.textContent = "✖";
  remove.className = "remove";
  remove.onclick = () => div.remove();

  div.appendChild(input);
  div.appendChild(remove);
  stopsContainer.appendChild(div);

  initAutocompleteField(input);
}

function initDragAndDrop() {
  new Sortable(stopsContainer, {
    animation: 150,
    ghostClass: "drag-ghost"
  });
}

function initAutoComplete() {
  Array.from(stopsContainer.querySelectorAll("input")).forEach(initAutocompleteField);
}

function initAutocompleteField(input) {
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["(cities)"]
  });
}

async function calculateRoute() {
  const stops = Array.from(stopsContainer.querySelectorAll("input")).map(i => i.value.trim()).filter(Boolean);
  if (stops.length < 2) {
    alert("Please enter at least an origin and destination");
    return;
  }

  const waypoints = stops.slice(1, -1).map(s => ({ location: s, stopover: true }));
  const rate = parseFloat(document.getElementById("rateInput").value || 3);

  const res = await directionsService.route({
    origin: stops[0],
    destination: stops[stops.length - 1],
    waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
  });

  directionsRenderer.setDirections(res);

  const totalMiles = res.routes[0].legs.reduce((acc, leg) => acc + leg.distance.value, 0) / 1609.34;
  const cad = totalMiles * rate;
  const usd = cad * 0.73;

  document.getElementById("summary").innerHTML = `
    🚗 Total Miles: <b>${totalMiles.toFixed(1)}</b> |
    💰 ${cad.toFixed(2)} CAD (${usd.toFixed(2)} USD)
  `;
}

function shareRoute() {
  const stops = Array.from(stopsContainer.querySelectorAll("input")).map(i => i.value).join(" ➜ ");
  const summary = document.getElementById("summary").innerText;
  const text = `Route: ${stops}\n${summary}`;
  if (navigator.share) {
    navigator.share({ title: "Route Details", text });
  } else {
    alert("Share API not supported — copying to clipboard.");
    navigator.clipboard.writeText(text);
  }
}

function saveRoute() {
  const stops = Array.from(stopsContainer.querySelectorAll("input")).map(i => i.value);
  const key = "route_" + location.href.split("?text=")[1];
  localStorage.setItem(key, JSON.stringify(stops));
  alert("📌 Route pinned to email!");
}
