function onMapClick(e) {
    //polygon.remove();
    pol.push([e.latlng.lat,e.latlng.lng])
    textbx = document.getElementById('OutputBox');
    textbx.value = JSON.stringify(activePolygon.polygon.toGeoJSON());
    activePolygon.polygon.setLatLngs(pol);
}

function newPolygon(name, color){
    //if (activePolygon != null) { listOfPolygons.push(activePolygon); }
    
    pol = new Array();
    activePolygon = { name: name, polygon: L.polygon(pol, {color: color}).addTo(map) }
    listOfPolygons.push(activePolygon);
    BuildPolygonList();

    //document.getElementById('PolygonsList').options.add(opt);
    EnableCrosshair();
}

function BuildPolygonList(){
    list = document.getElementById('PolygonsList');
    for (i = list.length - 1; i >= 0; i--) {
        list.remove(i);
    }
    //list.remove(list.selectedIndex);
    //list.remove();

    for (let index = 0; index <= listOfPolygons.length; index++) {
        opt = document.createElement("option");
        opt.text = listOfPolygons[index].name;
        opt.value = listOfPolygons[index].name; //Index might be better
        list.options.add(opt);
    }
}

function EnableCrosshair(){
    L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');
}

function DisableCrosshair(){
    L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
}

function makePolygonActive(e){
    console.log(e.value);
    for (let index = 0; index < listOfPolygons.length; index++) {
        if(listOfPolygons[index].name == e.value){
            console.log(pol);
            pol = listOfPolygons[index].polygon._latlngs[0];
            console.log(pol);
            //activePolygon = { name: listOfPolygons[index].name, polygon: L.polygon(pol, {color: listOfPolygons[index].polygon.options.color}).addTo(map) }
        }     
    }
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