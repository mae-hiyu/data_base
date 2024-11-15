export function FetchData() { // wikidataからデータを獲得するcomponent

    const endpoint = "https://query.wikidata.org/sparql"; // SPARQLエンドポイント

    var query = (function () {/*
                select ?countryLabel ?lat ?long ?population ?time
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
    */}).toString().match(/\n([\s\S]*)\n/)[1]; // クエリ

    // SPARQLクエリを実行してデータを取得
    var data = fetch(endpoint + "?query=" + encodeURIComponent(query), {
      headers: {"Accept": "application/json"} //headerを通して、JSON形式でのレスポンスを要求
    }).then(response=>response.json) // JSON形式の取得したデータ

    // 最終出力の連想配列result_dictの宣言
    let result_dict = {};

    // 各データの獲得（イベントとイベントじゃない場合分けが必要？)

    //国を中心にまとめたデータ(国ごとにデータを処理できる)
    data.results.bindings.forEach(element => {
        let country = element.countryLabel.value;
        let population = parseFloat(element.population.value);
        if (!result_dict[country]) {
          result_dict[country] = {}; // 新たな国のデータの登録
          result_dict[country].position = [parseFloat(element.lat.value), parseFloat(element.long.value)]; // 国の位置座標の登録
          result_dict[country].population = [population]; // 国の人数の登録
          result_dict[country].time = [parseFloat(element.time.value)]; // 国の年度または月の登録
          result_dict[country].radius = [Math.sqrt(population) / 1000]; // 描画する円の半径
        }
        else {
          result_dict[country].population.push(element.population.value); // 国の人数に新しいデータの追加
          result_dict[country].time.push(element.time.value); // 国の年度または月に関するデータの追加
        }
        // var event = element.event.value;
    });

    return result_dict
}





// 時系列中心にまとめたデータ(時系列順にデータを処理できる)
// data.results.bindings.forEach(element => {
//     let country = element.countryLabel.value;
//     let time = element.time.value;
//     let population = parseFloat(element.population.value);
//     if (!result_dict[time]) {
//       result_dict[time] = {};
//     }
//     result_dict[time][country] = {};
//     result_dict[time][country].position = [parseFloat(element.lat.value), parseFloat(element.long.value)];
//     result_dict[time][country].population = population;
//     result_dict[time][country].radius = Math.sqrt(population) / 1000;
//   })