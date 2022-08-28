function onMapClick(e) {
    //polygon.remove();
    pol.push([e.latlng.lat,e.latlng.lng])
    textbx = document.getElementById('OutputBox');
    //textbx.value +=  e.latlng + "\n";
    textbx.value = pol
    activePolygon.polygon.setLatLngs(pol);
}

function newPolygon(name, color){
    listOfPolygons.push(activePolygon);
    pol = new Array();
    activePolygon = { name: name, polygon: L.polygon(pol, {color: color}).addTo(map) }
}

//latlng: v
//lat: 50.15050636899788
//lng: 31.129760742187504