function onMapClick(e) {
    pol.push([e.latlng.lat,e.latlng.lng])
    generateActivePolygon(pol);
}

function undoButtonClick(e){
    pol.pop();
    generateActivePolygon(pol);
}

function generateActivePolygon(cordinates){
    textbx = document.getElementById('OutputBox');
    textbx.value = JSON.stringify(activePolygon.polygon.toGeoJSON());
    activePolygon.polygon.setLatLngs(cordinates);
    let currentDate = new Date().toJSON().slice(0, 10);
    exportData(listOfPolygons, currentDate + '.json', 'text/plain');
}

function newPolygon(name, color){
    //if (activePolygon != null) { listOfPolygons.push(activePolygon); }
    
    pol = new Array();
    activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(pol, {color: color}).addTo(map) }
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

    for (let index = 0; index < listOfPolygons.length; index++) {
        opt = document.createElement("option");
        opt.text = listOfPolygons[index].name;
        opt.value = listOfPolygons[index].id; //Index might be better
        list.options.add(opt);
    }
}

function RemoveSelected(e){
    for (let index = 0; index < listOfPolygons.length; index++) {
        if(listOfPolygons[index].id == e.id){
            listOfPolygons[index].polygon.remove();
            listOfPolygons.splice(index, 1);
        }
    }
    activePolygon = new Array();
    pol = new Array();
    BuildPolygonList();
}

function EnableCrosshair(){
    L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');
}

function DisableCrosshair(){
    L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
}

function makePolygonActive(e){
    for (let index = 0; index < listOfPolygons.length; index++) {
        if(listOfPolygons[index].id == e.value){
            activePolygon = listOfPolygons[index]
            pol = new Array();
            activePolygon.polygon._latlngs[0].forEach(element => { //TODO: replace with method getLatLngs()
                pol.push([element.lat,element.lng])
            });
            if(activePolygon.polygon.options.stroke){
                document.getElementById("strokeButton").value = "On"
            }else{
                document.getElementById("strokeButton").value = "Off"
            }
            document.getElementById("polygonName").value = activePolygon.name
                       
            generateActivePolygon();
            EnableCrosshair();
        }     
    }
}

function convertToJson(listOfPolygons){
    activePolygon.forEach(element => {
        
    });
    textbx.value = JSON.stringify(activePolygon.polygon.toGeoJSON());
}

function convertFromJson(listOfPolygons){
    var innerArray = Array();
    var item = Array();
    listOfPolygons.forEach(element => {
        item.name = element.name
        item.cordinates = JSON.stringify(element.polygon.toGeoJSON());
        innerArray.push(item)
    });
    return innerArray;
}

function exportData(polygonList, name, type) {
    var jsobObj = new Array();
    // = {id: activePolygon.id, name: activePolygon.name, polygonCordinates:activePolygon.polygon.getLatLngs(), color: activePolygon.polygon.options['color']}
    polygonList.forEach(element => {
        jsobObj.push({id: element.id, name: element.name, polygonCordinates:element.polygon.getLatLngs(), color: element.polygon.options['color']})
    });
    
    var jsonout = JSON.stringify(jsobObj);
    var a = document.getElementById("a");
    var file = new Blob([jsonout], {type: type});
    a.href = URL.createObjectURL(file);
    a.download = name;
}

function alertTest(){
    alert(e.latlng);
}

function importJsonData(JsonData){
    var innerArray = JSON.parse(JsonData);
    listOfPolygons = Array();
    innerArray.forEach(element => {
        var innerPolygon = {id: element.id, name: element.name, polygon: L.polygon(element.polygonCordinates, {color: element.color, stroke: false}).addTo(map) }
        innerPolygon.polygon.on({
            dblclick: selectPolygon
        })
        //innerPolygon.polygon.on('click', alertTest(e));
        listOfPolygons.push(innerPolygon);
        
    });
    BuildPolygonList();
    let currentDate = new Date().toJSON().slice(0, 10);
    exportData(listOfPolygons, currentDate + '.json', 'text/plain');
}

function uploadJson(e){
    //https://gomakethings.com/how-to-upload-and-process-a-json-file-with-vanilla-js/
    e.preventDefault();
	if (!file.value.length) return;
	let reader = new FileReader();
	reader.readAsText(file.files[0]);
    reader.onload = function() {
        importJsonData(reader.result);
    };
}

function redrawPolygons() { //TODO Broken :(
    listOfPolygons.forEach(element => {
        element.polygon.redraw();
    });
}

function selectPolygon(e){
    var layer=e.target;
    listOfPolygons.forEach(element => {
        var p = element.polygon
        if(layer == p){
            activePolygon = element;
            pol = new Array();
            activePolygon.polygon._latlngs[0].forEach(element => { //TODO: replace with method getLatLngs()
                pol.push([element.lat,element.lng])
            });
            if(activePolygon.polygon.options.stroke){
                document.getElementById("strokeButton").value = "On"
            }else{
                document.getElementById("strokeButton").value = "Off"
            }
            document.getElementById("polygonName").value = activePolygon.name
                       
            generateActivePolygon();
        }
    });
}

//latlng: v
//lat: 50.15050636899788
//lng: 31.129760742187504