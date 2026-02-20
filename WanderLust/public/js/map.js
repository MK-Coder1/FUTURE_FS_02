
/* Leaflet map initializer for listing show page */

(function () {
     // Guard: Leaflet and required DOM/data must exist
     if (typeof L === 'undefined') {
          console.warn('Leaflet library is not loaded. Map will not be initialized.');
          return;
     }

     if (typeof listing === 'undefined' || !listing || !listing.geometry || !listing.geometry.coordinates) {
          console.warn('Listing geometry missing, skipping map initialization.');
          return;
     }

     // GeoJSON coordinates are [lng, lat]
     const coords = listing.geometry.coordinates;
     const latLng = [coords[1], coords[0]]; // Leaflet wants [lat, lng]

     // Create the map
     const map = L.map('map').setView(latLng, 13);

     // OpenStreetMap tiles
     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
     }).addTo(map);

     // Marker and popup
     L.marker(latLng).addTo(map)
          .bindPopup((listing.title || 'Listing') + '<br><small>Exact location will be shown after booking</small>')
          .openPopup();
})();