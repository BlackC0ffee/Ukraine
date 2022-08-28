function onMapClick(e) {
    //polygon.remove();
    pol.push([e.latlng.lat,e.latlng.lng])
    textbx = document.getElementById('OutputBox');
    textbx.value = JSON.stringify(activePolygon.polygon.toGeoJSON());
    activePolygon.polygon.setLatLngs(pol);
}

function newPolygon(name, color){
    listOfPolygons.push(activePolygon);
    pol = new Array();
    activePolygon = { name: name, polygon: L.polygon(pol, {color: color}).addTo(map) }

    opt = document.createElement("option");
    opt.text = name;
    opt.value = name;
    document.getElementById('PolygonsList').options.add(opt);
}

function convertToJson(listOfPolygons){
    console.log("todo");
}

function convertFromJson(listOfPolygons){
    console.log("todo");
}

//latlng: v
//lat: 50.15050636899788
//lng: 31.129760742187504