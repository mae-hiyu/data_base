import React, {useEffect, useRef, useState} from "react";
import {MapContainer, TileLyaer, Popup, Circle} from "react-leaflet";

import {Slider, Typography} from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapMarker() {
    const [year, SetYear] = useState(2000);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    
    // WikiDataのSPARQLエンドポイント、LeafletマップのベースURLと設定
    const endpoint = "https://query.wikidata.org/sparql";
    const baseUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const baseAttribution = 'Map data &copy; OpenStreetMap contributors, Tiles Courtesy of OpenStreetMap Japan';
    const opacity = 0.6;
    const maxZoom = 5;
    
    const query = `
        select ?countryLabel ?lat ?long ?population ?time (year(?time) as ?year)
        where {
            ?country wdt:P31 wd:Q6256;
                    wdt:P625 ?location;
                    p:P1082 ?populationStatement.
            ?populationStatement ps:P1082 ?population.
            
            optional {?populationStatement pq:P585 ?time.}
            
            bind(geof:latitude(?location) AS ?lat)
            bind(geof:longitude(?location) as ?long)
            SERVICE wikibase:label { bd:serviceParam wikibase:language "ja". }
        }
        order by asc(?time)
        `;
    // dataのフェッチ
    const fetchData = (endpoint, query) => {
        return fetch(endpoint + "?query=" + encodeURIComponent(query), {
            headers: {"Accept": "application/json"}
        }).then(response=>response.json());
    };
    // データの補間
    const preprocessData = () => {
        const data = fetchData(endpoint, query);
        let result = {};
        data.results.bindings.forEach(element => { //! bindingsでエラーしている
            let country = element.countryLabel.value;
            console.log(country);
            let population = parseInt(element.population.value);
            console.log(population);
            if (!result[country]){
                result[country] = {};
                result[country].position = [parseFloat(element.lat.value), parseFloat(element.long.value)];
                result[country].population = [population];
                result[country].time = [parseInt(element.year.value)];
                result[country].radius = [Math.sqrt(population) / 1000];
            }
            else {
                result[country].population.push(parseInt(element.population.value));
                result[country].time.push(parseInt(element.year.value));
            }
        })

        Object.keys(result).forEach(countryKey => {
            let populationArray = result[countryKey].population;
            let timeArray = result[countryKey].time;
            let radiusArray = result[countryKey].radius;

            for (let i = 0; i < timeArray.length - 1; i++) {
                let current = timeArray[i];
                let next = timeArray[i+1];
                let interval = next - current;
                if (interval > 1) {
                    let difference = populationArray[i+1] - populationArray[i];
                    let avg = difference / interval;
                    for (let j = 1; j < interval; j++) {
                        populationArray.splice(i+j, 0, populationArray[i]+avg*j);
                        timeArray.splice(i+j, 0, current+j);
                        radiusArray.splice(i+j, 0, Math.sqrt(populationArray[i]+avg*j));
                    }
                    result[countryKey].population = populationArray;
                    result[countryKey].time = timeArray;
                    result[countryKey].radius = radiusArray;
                }
            }
        })
        return result
    }

    const getData = (data, year) => {
        let result = {};
        
        data.forEach(country => {
            let yearIndex = (country.time).indexOf(year);

            result[country] = {};
            result[country].lat = country.position.value[0];
            result[country].long = country.position.value[1];
            result[country].yearPopulation = country.population[yearIndex];
            // result[country].yearTime = country.time[yearIndex];
            result[country].yearRadius = country.radius[yearIndex];
        })
        return result;
    }

    useEffect(() => {
        // 地図の初期設定（初回のみ実行）
        if (!mapRef.current) {
          mapRef.current = L.map('map').setView([20, 0], 2);
          L.tileLayer(baseUrl, { attribution: baseAttribution, maxZoom }).addTo(mapRef.current);
        }
        
        const updateMarkers = async () => {
            const data = await preprocessData();
            const yearData = await getData(data, year);

            // 既存のマーカーを削除
            markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
            markersRef.current = [];

            // 新しいデータでマーカーを更新
            yearData.forEach(country => {
                const lat = country.lat.value;
                const long = country.long.value;
                const population = country.yearPopulation.value;
                const radius = country.yearRadius.value;

                const marker = L.circleMarker([lat, long], {
                    radius,
                    color: "#007bff",
                    fillColor: "#007bff",
                    fillOpacity: opacity
                  }).bindPopup(`${country}<br>Population: ${population.toLocaleString()}`);
                  
                  marker.addTo(mapRef.current);
                  markersRef.current.push(marker);
            });
          };
      
          updateMarkers(); // 年が変更されるたびにマーカーを更新
        }, [year]); // yearが変わるたびに再描画
      
        return (
          <div>
            <div id="map" style={{ height: "90vh" }} />
                  <Typography variant="h6" align="center">
              {year}
            </Typography>
            <Slider
              value={year}
              min={2000}
              max={2020}
              step={1}
              onChange={(event, newValue) => SetYear(newValue)}
              aria-labelledby="year-slider"
              valueLabelDisplay="auto"
            />
          </div>
        );
    }
