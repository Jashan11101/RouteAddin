Office.onReady(info => {
    if (info.host === Office.HostType.Outlook) {
        const item = Office.context.mailbox.item;

        // Pre-fill origin/destination if available
        let bodyText = item.subject || '';
        const route = bodyText.match(/([A-Za-z\s]+,\s?[A-Z]{2})\s*-\s*([A-Za-z\s]+,\s?[A-Z]{2})/);
        if (route) {
            document.getElementById("originInput").value = route[1];
            document.getElementById("destInput").value = route[2];
        }

        document.getElementById("calcBtn").onclick = () => {
            const origin = document.getElementById("originInput").value;
            const destination = document.getElementById("destInput").value;
            const stops = document.getElementById("stopsInput").value.split("\n").filter(s => s.trim() !== "");
            const rate = parseFloat(document.getElementById("rateInput").value);
            const currency = document.getElementById("currencySelect").value;

            const map = new google.maps.Map(document.getElementById("map"), {
                zoom: 5,
                center: { lat: 39.5, lng: -98.35 }
            });

            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(map);

            directionsService.route({
                origin: origin,
                destination: destination,
                waypoints: stops.map(loc => ({ location: loc, stopover: true })),
                travelMode: google.maps.TravelMode.DRIVING
            }, (response, status) => {
                if (status === "OK") {
                    directionsRenderer.setDirections(response);
                    let totalMeters = 0;
                    response.routes[0].legs.forEach(leg => totalMeters += leg.distance.value);
                    const miles = totalMeters / 1609.34;
                    let totalRate = miles * rate;
                    if (currency === "CAD") totalRate *= 1.35;

                    document.getElementById("result").innerText = `Distance: ${miles.toFixed(1)} miles\nTotal Rate: ${currency === 'CAD' ? 'C$' : '$'}${totalRate.toFixed(2)}`;
                } else {
                    alert("Could not calculate route: " + status);
                }
            });
        };
    }
});
