import React, {useEffect, useRef, useState} from "react";
import {MapContainer, TileLayer, Popup, Circle} from "react-leaflet";

import {Slider, Typography} from '@mui/material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapMarker() {
    const [year, SetYear] = useState(2000);
    const [updatedData, SetUpdatedData] = useState(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    
    // WikiDataのSPARQLエンドポイント、LeafletマップのベースURLと設定
    const endpoint = "http://127.0.0.1:8000/api/population-data/";
    const baseUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const baseAttribution = 'Map data &copy; OpenStreetMap contributors, Tiles Courtesy of OpenStreetMap Japan';
    const opacity = 0.6;
    const maxZoom = 5;
    

    //* dataのフェッチ
    const fetchData = async () => {
    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        };
        return data;
    } catch (error) {
        console.error('Fetch error: ', error);
        return null;
    }
};

const getData = (data, year) => { //* 年ごとのデータを取得
    let result = {};
    Object.keys(data).forEach(countryKey => {
        let countryData = data[countryKey];
        let yearIndex = (countryData.time).indexOf(year);
        if (yearIndex !== -1){
            result[countryKey] = {
                lat: countryData.position[0],
                long: countryData.position[1],
                yearPopulation: countryData.population[yearIndex],
                yearRadius: countryData.radius[yearIndex]
            }
            console.log(-1);
        }      
        else {
            console.log("1");
            return ;
        }
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
        // const fetch = await fetchData(endpoint, query);
        // const data = await preprocessData(fetch);
            const data = await fetchData();
            const yearData = getData(data, year);

            //* 既存のマーカーを削除
            markersRef.current.forEach(marker => mapRef.current.removeLayer(marker));
            markersRef.current = [];

            //* 新しいデータでマーカーを更新
            Object.keys(yearData).forEach(country => {
                const countryData = yearData[country];
                const lat = countryData.lat;
                const long = countryData.long;
                const population = countryData.yearPopulation;
                const radius = countryData.yearRadius;
                
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
