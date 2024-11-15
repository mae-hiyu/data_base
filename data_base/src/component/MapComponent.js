import React, { useEffect, useRef, useState } from 'react';

import { Slider,Typography } from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent() {
  const [year, setYear] = useState(2000); // 初期年
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  // LeafletマップのベースURLと設定
  const endpoint = "https://query.wikidata.org/sparql";
  const baseUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const baseAttribution = 'Map data &copy; OpenStreetMap contributors, Tiles Courtesy of OpenStreetMap Japan';
  const opacity = 0.6;
  const maxZoom = 5;

  useEffect(() => {
    // 地図の初期設定（初回のみ実行）
    if (!mapRef.current) {
      mapRef.current = L.map('map').setView([20, 0], 2);
      L.tileLayer(baseUrl, { attribution: baseAttribution, maxZoom }).addTo(mapRef.current);
    }

    // SPARQLクエリに基づいて年ごとのデータを取得
    const fetchYearlyData = (year) => {
      const query = `
			SELECT ?countryLabel ?lat ?long ?population ?populationInTime
			WHERE {
				?country wdt:P31 wd:Q6256;
								wdt:P1082 ?population;
								wdt:P625 ?location;
								p:P1082 ?populationStatement.
				?populationStatement pq:P585 ?pointInTime.

				FILTER(YEAR(?pointInTime) = ${year})

				BIND(geof:latitude(?location) AS ?lat)
				BIND(geof:longitude(?location) AS ?long)
				SERVICE wikibase:label { bd:serviceParam wikibase:language "ja". }
			}
      `;
      return fetch(endpoint + "?query=" + encodeURIComponent(query), {
        headers: { "Accept": "application/json" }
      }).then(response => response.json());
    };

    const updateMarkers = async () => {
      const data = await fetchYearlyData(year);

      // 既存のマーカーを削除
      markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
      markersRef.current = [];

      // 新しいデータでマーカーを更新
      data.results.bindings.forEach(place => {
        const lat = parseFloat(place.lat.value);
        const long = parseFloat(place.long.value);
        const population = parseInt(place.population.value);
        const radius = Math.sqrt(population) / 1000;  // バブルのサイズ調整

        const marker = L.circleMarker([lat, long], {
          radius,
          color: "#007bff",
          fillColor: "#007bff",
          fillOpacity: opacity
        }).bindPopup(`${place.countryLabel.value}<br>Population: ${population.toLocaleString()}`);

        marker.addTo(mapRef.current);
        markersRef.current.push(marker);
      });
    };

    updateMarkers(); // 年が変更されるたびにマーカーを更新
  }, [year]); // yearが変わるたびに再描画

  return (
    <div>
      <div id="map" style={{ height: "90vh" }} />
      <div style={{padding: "10px 50px"}}>
        <Typography variant="h6" align="center">
          {year} 
        </Typography>
        <Slider
          value={year}
          min={2000}
          max={2020}
          step={1}
          onChange={(event, newValue) => setYear(newValue)}
          aria-labelledby="year-slider"
          valueLabelDisplay="auto"
        />
      </div>
    </div>
  );
}