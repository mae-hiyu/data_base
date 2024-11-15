import React from "react"

const FetchData = () =>{
    fetch("https://query.wikidata.org/sparql");
}

// sparqlQuery.js
export const sparqlQuery = `
  SELECT ?item ?itemLabel WHERE {
    ?item wdt:P31 wd:Q146. # Q146は "猫" のWikidata ID (例)
    SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
  }
`;

// WikidataエンドポイントURL
export const endpointUrl = "https://query.wikidata.org/sparql";

// データ取得関数
export async function fetchData(query) {
  const url = `${endpointUrl}?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/sparql-results+json'
    }
  });
  const data = await response.json();
  return data.results.bindings;
}