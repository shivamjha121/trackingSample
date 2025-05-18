 let currentShopIndex = 0;
  let sortedShops = [];

  // Initialize the map and seller/shop markers as before
  const map = new maplibregl.Map({
    container: "map",
    style: "https://api.maptiler.com/maps/bright/style.json?key=maVC2MxszEJEDnq3GcBX",
    center: [-115.1398, 36.1699],
    zoom: 12,
  });

  map.addControl(new maplibregl.NavigationControl());

  const user = {
    seller: {
      id: "12345",
      name: "John Doe",
      location: {
        lat: 36.1699,
        lng: -115.1398,
      },
    },
  };

  const shops = [
    { id: "1", name: "Gizmo Gadgets", location: { lat: 36.1665 + Math.random() * 0.05, lng: -115.142 + Math.random() * 0.05 } },
    { id: "2", name: "Laptop Land", location: { lat: 36.1702 + Math.random() * 0.05, lng: -115.1456 + Math.random() * 0.05 } },
    { id: "3", name: "Phone Hub", location: { lat: 36.173 + Math.random() * 0.05, lng: -115.139 + Math.random() * 0.05 } },
    { id: "4", name: "Tech Store", location: { lat: 36.1745 + Math.random() * 0.05, lng: -115.1378 + Math.random() * 0.05 } },
  ];

  const optimizedRouteList = document.getElementById("optimized-route");
  const findRouteBtn = document.getElementById("find-route-btn");

  map.on("load", function () {
    // Add seller marker (Green)
    new maplibregl.Marker({ color: "green" })
      .setLngLat([user.seller.location.lng, user.seller.location.lat])
      .setPopup(new maplibregl.Popup().setHTML(`<h3>${user.seller.name}</h3>`))
      .addTo(map)
      .togglePopup();

    // Add shop markers
    shops.forEach((shop) => {
      new maplibregl.Marker({ color: "red" })
        .setLngLat([shop.location.lng, shop.location.lat])
        .setPopup(new maplibregl.Popup().setHTML(`<h3>${shop.name}</h3>`))
        .addTo(map);
    });

    // Add seller radius circle (10 km)
    const circle = turf.circle([user.seller.location.lng, user.seller.location.lat], 10000, { steps: 64, units: "meters" });
    map.addSource("seller-circle", { type: "geojson", data: circle });
    map.addLayer({
      id: "circle-fill",
      type: "fill",
      source: "seller-circle",
      paint: { "fill-color": "#ff0000", "fill-opacity": 0.3 },
    });
  });

  findRouteBtn.addEventListener("click", () => {
    const shopDistances = shops.map((shop) => {
      const distance = turf.distance(
        [user.seller.location.lng, user.seller.location.lat],
        [shop.location.lng, shop.location.lat],
        { units: "kilometers" }
      );
      return { shop, distance };
    });

    sortedShops = shopDistances.sort((a, b) => a.distance - b.distance).map(item => item.shop);
    currentShopIndex = 0;

    optimizedRouteList.innerHTML = "";
    sortedShops.forEach((shop, index) => {
      const li = document.createElement("li");
      li.className = "route-item";
      li.id = `shop-${shop.id}`;
      li.textContent = `${index + 1}. ${shop.name}`;
      li.addEventListener("click", () => {
        currentShopIndex = index;
        createRoute(shop);
      });
      optimizedRouteList.appendChild(li);
    });

    // Start routing to the first shop
    createRoute(sortedShops[0]);
  });

  function createRoute(shop) {
    if (!shop) return;

    const routeData = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [user.seller.location.lng, user.seller.location.lat],
            [shop.location.lng, shop.location.lat],
          ],
        },
      }],
    };

    if (map.getSource("route")) {
      map.removeLayer("route");
      map.removeSource("route");
    }

    map.addSource("route", {
      type: "geojson",
      data: routeData,
    });

    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      paint: {
        "line-color": "#ff0000",
        "line-width": 5,
      },
    });
  }

  let userLocationMarker;
  map.on("dblclick", (e) => {
    const clickedLngLat = e.lngLat;

    if (userLocationMarker) {
      userLocationMarker.setLngLat(clickedLngLat);
    } else {
      userLocationMarker = new maplibregl.Marker({ color: "blue" })
        .setLngLat(clickedLngLat)
        .addTo(map);
    }

    user.seller.location = {
      lat: clickedLngLat.lat,
      lng: clickedLngLat.lng,
    };

    // Check if within 100 meters of current shop
    const currentShop = sortedShops[currentShopIndex];
    const distanceToCurrent = turf.distance(
      [user.seller.location.lng, user.seller.location.lat],
      [currentShop.location.lng, currentShop.location.lat],
      { units: "meters" }
    );

    if (distanceToCurrent < 100) {
      // Mark as completed
      const currentLi = document.getElementById(`shop-${currentShop.id}`);
      if (currentLi) currentLi.style.backgroundColor = "#a8e6a3"; // Green

      currentShopIndex++;
    }

    // Route to next shop if exists
    if (sortedShops[currentShopIndex]) {
      createRoute(sortedShops[currentShopIndex]);
    }
  });