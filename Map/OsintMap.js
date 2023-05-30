class OsintMap {
    #pol = new Array();
    #listOfPolygons = new Array();
    #buttonFunctions = {};
    #activePolygon; #snapping; #stats; #debugDiv; #newPolygonBlock; #colorList; #polygonName; #editPolygonBlock;
    #mainMenuBlock; #openFile; #newPolygonButton; #Reader; #objectTypeField; #objectNameField; #editButton; #downloadFileButton;

    constructor(map) {
        if(map instanceof L.Map){
            this._map = map;
            this._map.doubleClickZoom.disable();
        }else{
            return false;
        }

        const renderFunctions = ['addNewPolygon', 'onMapClick', 'importJsonData', 'makePolygonActive']; // Functions that require the Render to run at the end needs to be added to this list.

        // Iterate over the function names and wrap each one
        for (const functionName of renderFunctions) {
            if (typeof this[functionName] === 'function') {
                this[functionName] = this.#wrapFunction(this[functionName]);
            }
        }

        this.clickEvent = this.clickEvent.bind(this);
        this.openFileChange = this.openFileChange.bind(this);
        this.importJsonData = this.importJsonData.bind(this);
        this.dblclickOnPolygonEvent = this.dblclickOnPolygonEvent.bind(this);
        this.#snapping = false; //Todo remove or change?
    }

    set stats(value){
        this.#stats = value
    }

    set debugDiv(value){
        this.#debugDiv = value
    }

    set mainMenuBlock(value){
        this.#mainMenuBlock = value;
        this.#mainMenuBlock.innerHTML = `
        <p><input type="button" value="Open" id="openFileButton"/> <code id="openFileName" disabled >No file chosen</code><input type="file" id="openFile" style="display: none;" accept=".json"></p>
        <p><input type="button" value="Download File" id="downloadFileButton" disabled /></p>
        <hr class="smallHr">
        <p class="pToolButton"><input type="button" value="New Polygon" id="newPolygonButton" disabled /> <input type="button" value="New Line" id="newLineButton" disabled /></p>
        <hr class="smallHr">
        <table id="activeObjectTable">
            <tr>
            <th colspan="2" id='activeObjectTableHeader'>Active Object</th>
            </tr>
            <tr>
            <td>Object Type</td>
            <td id='objectTypeField'></td>
            </tr>
            <tr>
            <td>Object Name</td>
            <td id='objectNameField'></td>
            </tr>
        </table>
        <p class="pToolButton"><input type="button" value="Edit" id="editButton" disabled /> <input type="button" value="Remove" id="removeButton" disabled /></p>
        `;

        this.#openFile = this.#mainMenuBlock.querySelector('#openFile');
        this.#newPolygonButton = this.#mainMenuBlock.querySelector('#newPolygonButton');
        this.#objectTypeField = this.#mainMenuBlock.querySelector('#objectTypeField');
        this.#objectNameField = this.#mainMenuBlock.querySelector('#objectNameField');
        this.#editButton = this.#mainMenuBlock.querySelector('#editButton');
        this.#downloadFileButton = this.#mainMenuBlock.querySelector('#downloadFileButton');
        this.addButtonFunction('openFileButton',this.openFileClick);
        this.#openFile.addEventListener('change',this.openFileChange);

        this.addButtonFunction('downloadFileButton', this.exportDataToJson);

    }

    set newPolygonBlock(value){
        this.#newPolygonBlock = value;
        this.#newPolygonBlock.innerHTML = `
        <p>Name: <input type="text" name="polygonName" id="polygonName"></p>
        <p>Color: <select id="colorList">
            <option value="#FFB400">Contested</option>
            <option value="#004BFF">Ukraine</option>  
            <option value="#C80000">Russia</option>
        </select> <button id="newPolygon" onclick="">Add Polygon</button></p>
        `;
        this.#colorList = this.#newPolygonBlock.querySelector('#colorList');
        this.#polygonName = this.#newPolygonBlock.querySelector('#polygonName');
        this.#newPolygonBlock.style.display = 'none';
        this.#newPolygonButton.disabled = false;
        this.addButtonFunction('newPolygonButton',this.showBlock, this.#newPolygonBlock, undefined);
        this.addButtonFunction('newPolygon',this.newPolygonEvent);
        this.#newPolygonBlock.querySelector('#newPolygon').addEventListener('click', this.clickEvent);
        
        //document.getElementById("newPolygon").addEventListener("click", this.addNewPolygon);
        //TODO: Make the newPolygonButton active
    }

    set editPolygonBlock(value){
        this.#editPolygonBlock = value;
        this.#editPolygonBlock.innerHTML = `
        <p><button id="undoButton">Undo</button> | Snap: <input type="button" value="Off" id="snapButton" onclick="snapButtonCick(this);"> | <button id="doneButton">Done</button></p>
        `;
        this.#editPolygonBlock.style.display = 'none';
        this.addButtonFunction('editButton',this.showBlock, this.#editPolygonBlock, undefined); // need to be moved to menu?
    }

    #wrapFunction(fn) {
        return (...args) => {
          //this.functionD();
          const result = fn.call(this, ...args);
          this.render();
          return result;
        }
    }

    render(){
        console.log('Running render');
        this.returnStats();
        this.updatePolygonList();
        if(this.#activePolygon){
            this.#activePolygon.polygon.setLatLngs(this.#pol);
            this.#objectTypeField.innerHTML = this.#activePolygon.type;
            this.#objectNameField.innerHTML = this.#activePolygon.name;
            this.#editButton.disabled = false;
        }else{
            this.#editButton.disabled = true;
        }

        if(this.#listOfPolygons.length > 0){
            this.#downloadFileButton.disabled = false;
        }else{
            this.#downloadFileButton.disabled = true;
        }

        return true;
    }

    showBlock(block, forceValue){
        if (typeof forceValue === 'undefined'){
            if(block.style.display == 'block'){
                forceValue = 'none';
            }else{
                forceValue = 'block';
            }
        }
        block.style.display = forceValue;
    }

    addButtonFunction(buttonId, buttonFunction, ...args) {
        this.#buttonFunctions[buttonId] = buttonFunction.bind(this, ...args);

        let button = document.getElementById(buttonId);
        if(button){
            button.addEventListener('click', this.clickEvent);
        }
    }

    clickEvent(e){
        const buttonId = e.target.id;
        const buttonFunction = this.#buttonFunctions[buttonId];
        if (buttonFunction) {
          buttonFunction(e);
        }
    }

//#region MainMenuRegion
    openFileClick(){
        console.log("Open File button clicked");
        this.#openFile.click();
    }

    openFileChange(){
        let file = this.#openFile.files[0];
        let openFileName  = this.#mainMenuBlock.querySelector('#openFileName');
        if(file){
            openFileName.innerHTML = file.name;
            this.#Reader = new FileReader();
            this.#Reader.addEventListener("load", this.importJsonData);
            this.#Reader.readAsText(file);
        }
    }

//#endregion

//#region EditPolygonRegion
    dblclickOnPolygonEvent(e){
        let layer=e.target;
        this.#listOfPolygons.forEach(element => {
            let p = element.polygon
            if(layer == p){
                this.makePolygonActive(element.id);
            }
        });
    }

    makePolygonActive(polygonId){
        for (let index = 0; index < this.#listOfPolygons.length; index++) {
            if(this.#listOfPolygons[index].id == polygonId){
                this.#activePolygon = this.#listOfPolygons[index]
                this.#pol = new Array();
                this.#activePolygon.polygon._latlngs[0].forEach(element => { //TODO: replace with method getLatLngs()
                    this.#pol.push([element.lat,element.lng])
                });
                // if(activePolygon.polygon.options.stroke){
                //     document.getElementById("strokeButton").value = "On"
                // }else{
                //     document.getElementById("strokeButton").value = "Off"
                // }
            }     
        }
    }
//#region 

//#region NewPolygonRegion

    newPolygonEvent(e){
        let name = this.#polygonName.value;
        if(name == ""){
            name = this.#colorList[this.#colorList.selectedIndex].innerText;
        }
        this.addNewPolygon(name, this.#colorList.value);
        this.showBlock(this.#newPolygonBlock, 'none');
        // TODO: Show Polygon Edit block
        // TODO Disable New Polygon untill "done" has been pushed
    }

    addNewPolygon(name, color){
        console.log('Running addNewPolygon');
        this.#pol = new Array();
        this.#activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(this.#pol, {color: color, stroke: true}).addTo(this._map) }
        this.#listOfPolygons.push(this.#activePolygon);
        map.on('click', this.onMapClick);
        this.showBlock(this.#newPolygonBlock, 'none');
        this.showBlock(this.#editPolygonBlock, 'block');
        //if(document.getElementById("selectPolygonButton").textContent == "On"){ document.getElementById("selectPolygonButton").dispatchEvent(new Event('click')); }
        //if(document.getElementById("strokeButton").value == "Off"){ document.getElementById("strokeButton").dispatchEvent(new Event('click')); }
    }

    onMapClick(e) {
        let latlng;
        if(this.#snapping){
            latlng = findClosetNode(e);
        }else{
            latlng = e.latlng;
        }
        this.#pol.push([latlng.lat,latlng.lng]);
    }
//#endregion

//#region HelpFunctions
    returnStats(){
        if(this.#stats){
            let nodecounter = 0
            this.#listOfPolygons.forEach(element => {
                if(element.polygon){
                    nodecounter += element.polygon._latlngs[0].length;
                }
            });
            nodecounter += this.#pol.length;
            stats.textContent = "Number of Polygons: " + this.#listOfPolygons.length + "\rNumber of nodes: " + nodecounter;
        }
        return true
    }

    updatePolygonList(){ // old name BuildPolygonList
        let opt;
        let polygonList = this.#debugDiv.querySelector('select');

        if(!polygonList){
            polygonList = document.createElement("select");
            polygonList.id = "NewPolygonsList";
            polygonList.size = "10";
            this.#debugDiv.appendChild(polygonList);
        }else{
            polygonList.innerHTML = '';
        }     
   
        for (let index = 0; index < this.#listOfPolygons.length; index++) {
            opt = document.createElement("option");
            opt.text = this.#listOfPolygons[index].name;
            opt.value = this.#listOfPolygons[index].id; //Index might be better
            polygonList.options.add(opt);
        }

        return true;
    }

    findClosetNode(e){
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


//#endregion

//#region Import/Export Functions
    importJsonData(e){
        let innerArray = JSON.parse(this.#Reader.result);
        //Clear all Polygons if needed
        if(this.#listOfPolygons.length > 0){
            this.#listOfPolygons.forEach(element => { 
                element.polygon.remove();
            });
        }
        this.#listOfPolygons = Array(); // Clear current Array
        innerArray.forEach(element => {
            if(!element.stroke){
                element.stroke = false;
            }
            if(!element.type){
                element.type = 'polygon';
            }
            let innerPolygon = {id: element.id, type: element.type, name: element.name, polygon: L.polygon(element.polygonCordinates, {color: element.color, stroke: element.stroke}).addTo(map) }
            innerPolygon.polygon.on({
                dblclick: this.dblclickOnPolygonEvent //FIX: should be called when creating the polygon I guess, not only when uploading/redrawing the polygons
            });
            this.#listOfPolygons.push(innerPolygon);
            
        });
    }

    exportDataToJson() {
        let jsobObj = new Array();
        let jsonOut; let file; let link; let objectURL;
        let name = new Date().toJSON().slice(0, 10) + '.json';
        let type = 'text/plain';
        this.#listOfPolygons.forEach(element => {
            jsobObj.push({id: element.id, type: element.type, name: element.name, polygonCordinates:element.polygon.getLatLngs(), color: element.polygon.options['color'], stroke: element.polygon.options['stroke']})
        });
        
        // Create the Object
        jsonOut = JSON.stringify(jsobObj);
        file = new Blob([jsonOut], {type: type});
        objectURL = URL.createObjectURL(file);

        //Link the Object to a hidden A-tag
        link = document.createElement("a");
        link.style.display = "none";     
        document.body.appendChild(link);
        link.href = objectURL;
        link.download = name;

        //Trigger the download. <- *Insert hackerman meme here* 
        link.click();

        //Cleanup
        URL.revokeObjectURL(objectURL);
        document.body.removeChild(link);
        return true;
    }
//#endregion
}