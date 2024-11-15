# api/views.py
from .models import Country, PopulationData
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests

@csrf_exempt
def get_and_save_population_data(request):
    endpoint = "https://query.wikidata.org/sparql"
    query = """
        select ?countryLabel ?lat ?long ?population ?time (year(?time) as ?year)
        where {
            ?country wdt:P31 wd:Q6256;
                    wdt:P625 ?location;
                    p:P1082 ?populationStatement.
            ?populationStatement ps:P1082 ?population.
            
            optional {{?populationStatement pq:P585 ?time.} union {?populationStatement pq:P577 ?time.}}
            FILTER(year(?time) >= 2000 && year(?time) <= 2020)
          
            bind(geof:latitude(?location) AS ?lat)
            bind(geof:longitude(?location) as ?long)
            SERVICE wikibase:label { bd:serviceParam wikibase:language "ja". }
        }
        order by asc(?time)
    """
    headers = {
        "Accept": "application/json"
    }
    
    response = requests.get(endpoint, params={"query": query}, headers=headers)
    if response.status_code == 200:
        raw_data = response.json()
        result = {}
        
        # データの保存および補完処理
        for record in raw_data["results"]["bindings"]:
            country_name = record['countryLabel']["value"]
            lat = float(record['lat']["value"])
            long = float(record['long']["value"])
            population = float(record['population']["value"])
            year = int(record['year']["value"])
            
            # Countryデータの作成または取得
            country, created = Country.objects.get_or_create(
                name=country_name,
                defaults={"lat": lat, "long": long}
            )
            
            # 結果の構造を準備
            if country_name not in result:
                result[country_name] = {
                    'country': country,
                    'data': []
                }
            
            result[country_name]['data'].append({
                'year': year,
                'population': population
            })
        
        # 補完ロジックとデータ保存
        for country_name, details in result.items():
            data = sorted(details['data'], key=lambda x: x['year'])  # 年でソート
            for i in range(len(data) - 1):
                interval = data[i + 1]['year'] - data[i]['year']
                if interval > 1:
                    step = (data[i + 1]['population'] - data[i]['population']) / interval
                    for j in range(1, interval):
                        interpolated_year = data[i]['year'] + j
                        interpolated_population = data[i]['population'] + step * j
                        
                        # データベースに補完データを保存
                        PopulationData.objects.update_or_create(
                            country=details['country'],
                            year=interpolated_year,
                            defaults={
                                'population': interpolated_population,
                                'radius': (interpolated_population ** 0.5) / 1000
                            }
                        )
            
            # 元のデータを保存
            for record in data:
                PopulationData.objects.update_or_create(
                    country=details['country'],
                    year=record['year'],
                    defaults={
                        'population': record['population'],
                        'radius': (record['population'] ** 0.5) / 1000
                    }
                )
        
        return JsonResponse({"message": "Data successfully fetched, interpolated, and saved."})
    else:
        return JsonResponse({"error": "Failed to fetch data"}, status=response.status_code)
    
def get_population_by_year(request, year):
    try:
        data = PopulationData.objects.filter(year=year).select_related('country')
        response = {
            "year": year,
            "data": [
                {
                    "country": item.country.name,
                    "lat": item.country.lat,
                    "long": item.country.long,
                    "population": item.population,
                    "radius": item.radius
                }
                for item in data
            ]
        }
        
        return JsonResponse(response)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)