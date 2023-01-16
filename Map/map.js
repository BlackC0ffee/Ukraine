function onMapClick(e) {
    if(snapping){
        latlng = findClosetNode(e);
        pol.push([latlng.lat,latlng.lng]);
    }else{
        pol.push([e.latlng.lat,e.latlng.lng]);
    }
    generateActivePolygon(pol);
}

function initVariable(){ //add optional expection for blob (a.href), then use it as reset function
    if(globalThis.listOfPolygons){
        globalThis.listOfPolygons.forEach(element => { 
            element.polygon.remove();
        });
    }
    globalThis.pol = new Array();
    globalThis.listOfPolygons = new Array();
    globalThis.activePolygon = '';
    globalThis.snapping = false;
    globalThis.currentDate = new Date().toJSON().slice(0, 10);
    globalThis.mode = 'select'
}

function newPolygonEvent() {
    var name;
    colorOptions = document.getElementById('colorList')
    if(document.getElementById('polygonName').value != ""){
        name = document.getElementById('polygonName').value;
    }else{
        name = colorOptions[colorOptions.selectedIndex].innerText;
    }
    newPolygon(name, colorOptions.value);
    document.getElementById('addNewPolygon').style.display = 'none';
    document.getElementById('editToolsDiv').style.display = 'block';
}

function findClosetNode(e){ // BROKEN, needs to be replaced with a distance to nodes
    let closestNode;
    let distance;
    let smallestDistance = 40000000;

    listOfPolygons.forEach(element => {
        if(activePolygon.id != element.id){ //skip its own polygon
            let latLngs = element.polygon.getLatLngs();
            latLngs[0].forEach(element => {
                distance = e.latlng.distanceTo(element);
                if(smallestDistance > distance){
                    smallestDistance = distance;
                    closestNode = element;
                }
            });
        }
    });
    return { lat: closestNode.lat, lng: closestNode.lng}
}

//controls

function undoButtonClick(e){
    pol.pop();
    generateActivePolygon(pol);
}

function snapButtonCick(e){
    currentvalue = e.value;
    if(currentvalue == "Off"){
      e.value="On";
      globalThis.snapping = true;
      snapping = true;
    }else{
      e.value="Off";
      globalThis.snapping = false;
    }
}

function generateActivePolygon(cordinates){
    textbx = document.getElementById('OutputBox');
    textbx.value = JSON.stringify(activePolygon.polygon.toGeoJSON());
    activePolygon.polygon.setLatLngs(cordinates);

    // generate Export Datya
    exportData(listOfPolygons, currentDate + '.json', 'text/plain');
    
}

function newPolygon(name, color){
    pol = new Array();
    activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(pol, {color: color, stroke: true}).addTo(map) }
    listOfPolygons.push(activePolygon);
    BuildPolygonList();
    EnableCrosshair();
    if(document.getElementById("selectPolygonButton").textContent == "On"){ document.getElementById("selectPolygonButton").dispatchEvent(new Event('click')); }
    if(document.getElementById("strokeButton").value == "Off"){ document.getElementById("strokeButton").dispatchEvent(new Event('click')); }
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

    //Stats
    stats = document.getElementById('stats');
    nodecounter = 0
    globalThis.listOfPolygons.forEach(element => {
        nodecounter += element.polygon._latlngs[0].length;
    });
    stats.textContent = "Number of Polygons: " + globalThis.listOfPolygons.length + "\rNumber of nodes: " + nodecounter;
}

function RemoveSelected(){
    for (let index = 0; index < listOfPolygons.length; index++) {
        if(listOfPolygons[index].id == globalThis.activePolygon.id){
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

function makePolygonActive(polygonId){
    for (let index = 0; index < listOfPolygons.length; index++) {
        if(listOfPolygons[index].id == polygonId){
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

            document.getElementById("activePolygonName").value = activePolygon.name
                
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
        jsobObj.push({id: element.id, name: element.name, polygonCordinates:element.polygon.getLatLngs(), color: element.polygon.options['color'], stroke: element.polygon.options['stroke']})
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
        if(!element.stroke){
            element.stroke = false;
        }
        var innerPolygon = {id: element.id, name: element.name, polygon: L.polygon(element.polygonCordinates, {color: element.color, stroke: element.stroke}).addTo(map) }
        if (globalThis.mode == 'select'){
            innerPolygon.polygon.on({
                dblclick: dblclickOnPolygonEvent //FIX: should be called when creating the polygon I guess, not only when uploading/redrawing the polygons
            })
        }
        listOfPolygons.push(innerPolygon);
        
    });
    BuildPolygonList();
    exportData(listOfPolygons, currentDate + '.json', 'text/plain');
}

function uploadJson(e){
    initVariable(); //renew everything
    //https://gomakethings.com/how-to-upload-and-process-a-json-file-with-vanilla-js/
    e.preventDefault();
	if (!file.value.length) return;
	let reader = new FileReader();
	reader.readAsText(file.files[0]);
    reader.onload = function() {
        importJsonData(reader.result);
    };
}

function redrawPolygons() {
    let a = document.getElementById("a");
    let reader = new FileReader();

    initVariable();
    fetch(a.href).then(res => res.blob()).then(blob => {
        //reader.readAsDataURL(blob);
        reader.readAsText(blob);
        reader.onload = function() {
            importJsonData(reader.result);
        };
    })
    //TODO activate the last active polygon (if possible)
}

function stroke(e){
    currentvalue = e.currentTarget.value;
    if(currentvalue == "Off"){
      e.currentTarget.value="On";
      activePolygon.polygon.setStyle({stroke: true})
    }else{
      e.currentTarget.value="Off";
      activePolygon.polygon.setStyle({stroke: false})
    }
    exportData(listOfPolygons, currentDate + '.json', 'text/plain');
  }
  
function selectPolygonOnOff(e){

    //Enable =
        //1. add dblKlik to polygons
        //2. Set curosr on arrow
        //3. disable onMapClick
        //4. Set text of button on On

    //Disable =
        //1. remove dblKlik to polygons
        //2. Leave cursor
        //3. enable onMapClick
        //4. set Text of button on Off

    e = document.getElementById('selectPolygonButton');
    if(e.textContent == "Off"){
        e.textContent = "On";
        map.off('click', onMapClick);
        globalThis.listOfPolygons.forEach(element => {
            element.polygon.on({ dblclick: dblclickOnPolygonEvent });
        });
    }else{
        e.textContent = "Off";
        map.on('click', onMapClick);
        globalThis.listOfPolygons.forEach(element => {
            element.polygon.off({ dblclick: dblclickOnPolygonEvent });
        });
        //activePolygon.polygon.setStyle({stroke: false})
    }
}

function getRenamePrompt(e) {
    let currentActiveName = document.getElementById('activePolygonName').value
    if(! currentActiveName){
        let name = prompt("Rename Polygon", currentActiveName);
        if(!name){
            //get id of current active polygon and change the name
        }
    }
}

function changeColor(){
    if(!activePolygon){
        alert("There is currently no Active Polygon");
        return;
    }
    let colorOptions = document.getElementById('changeColorList');
    for (var i=0; i<colorOptions.length; i++){
        if(colorOptions.options[i].value == activePolygon.polygon.options.color){
            colorOptions.options[i].selected = true;
        }   
    }
    document.getElementById('changeColorDiv').style.display = 'block';
}

//EventHandlers
function dblclickOnPolygonEvent(e){
    let layer=e.target;
    listOfPolygons.forEach(element => {
        let p = element.polygon
        if(layer == p){
            makePolygonActive(element.id);
        }
    });
}

function polygonSelectObjectChange(){
    makePolygonActive(this.options[this.selectedIndex].value);
}

function updateColor(){
    if(!activePolygon){
        alert("There is currently no Active Polygon");
        return;
    }
    let colorOptions = document.getElementById('changeColorList');
    activePolygon.polygon.setStyle({color: colorOptions.value});
    exportData(listOfPolygons, currentDate + '.json', 'text/plain');
    document.getElementById('changeColorDiv').style.display = 'none';
}

function editPolygonButtonEvent(){
    selectPolygonOnOff();
    EnableCrosshair();
    document.getElementById('editToolsDiv').style.display = 'block';
}

function newPolygonButtonEvent(){
    document.getElementById('addNewPolygon').style.display = 'block';
}

function doneButtonEvent(){
    document.getElementById('editToolsDiv').style.display = 'none';
}


//latlng: v
//lat: 50.15050636899788
//lng: 31.129760742187504