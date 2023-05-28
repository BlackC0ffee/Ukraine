class OsintMap {
    #pol = new Array();
    #listOfPolygons = new Array();
    #buttonFunctions = {};
    #activePolygon; #snapping; #stats; #debugDiv; #newPolygonBlock; #colorList; #polygonName; #editPolygonBlock;
    #mainMenuBlock; #openFile; #newPolygonButton; #Reader;

    constructor(map) {
        if(map instanceof L.Map){
            this._map = map;
        }else{
            return false;
        }

        const renderFunctions = ['addNewPolygon', 'onMapClick']; // Functions that require the Render to run at the end needs to be added to this list.

        // Iterate over the function names and wrap each one
        for (const functionName of renderFunctions) {
            if (typeof this[functionName] === 'function') {
                this[functionName] = this.#wrapFunction(this[functionName]);
            }
        }

        this.clickEvent = this.clickEvent.bind(this);
        this.openFileChange = this.openFileChange.bind(this);

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
            <td></td>
            </tr>
            <tr>
            <td>Object Name</td>
            <td></td>
            </tr>
        </table>
        <p class="pToolButton"><input type="button" value="Edit" id="editButton" disabled /> <input type="button" value="Remove" id="removeButton" disabled /></p>
        `;

        this.#openFile = this.#mainMenuBlock.querySelector('#openFile');
        //this.#newPolygonButton = this.#mainMenuBlock.querySelector('#newPolygonButton');
        this.addButtonFunction('openFileButton',this.openFileClick);
        this.#openFile.addEventListener('change',this.openFileChange);

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
        this.#activePolygon.polygon.setLatLngs(this.#pol);
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
        // this.#openFile.onchange = function () {
        //     var file = this.#openFile.files[0];
        //     //var fileNameElement = document.getElementById('openFileName');
      
        //     if (file && file.type === 'application/json') {
        //       fileNameElement.textContent = file.name;
      
        //       // Perform your action for a valid file here
        //       // For example, you can access the file content using FileReader API
        //       var reader = new FileReader();
        //       reader.onload = function (e) {
        //         var fileContent = e.target.result;
        //         // Process the file content as needed
        //       };
        //       reader.readAsText(file);
        //     } else {
        //       fileNameElement.textContent = '';
        //       alert('Please choose a valid JSON file.');
        //     }
        //   };
        this.#openFile.click();
    }

    openFileChange(){
        let file = this.#openFile.files[0];
        let openFileName  = this.#mainMenuBlock.querySelector('#openFileName');
        openFileName.innerHTML = file.name;

        this.#Reader = new FileReader();
        this.#Reader.addEventListener("load", this.importJsonData)
        this.#Reader.readAsText(file);
        // reader.onload = function() {
        // this.importJsonData(reader.result);
        // };
    }

    importJsonData(e){
        var innerArray = JSON.parse(e.currentTarget.result);
        listOfPolygons = Array();
        // innerArray.forEach(element => {
        //     if(!element.stroke){
        //         element.stroke = false;
        //     }
        //     var innerPolygon = {id: element.id, name: element.name, polygon: L.polygon(element.polygonCordinates, {color: element.color, stroke: element.stroke}).addTo(map) }
        //     if (globalThis.mode == 'select'){
        //         innerPolygon.polygon.on({
        //             dblclick: dblclickOnPolygonEvent //FIX: should be called when creating the polygon I guess, not only when uploading/redrawing the polygons
        //         })
        //     }
        //     listOfPolygons.push(innerPolygon);
            
        // });
        //BuildPolygonList();
        //exportData(listOfPolygons, currentDate + '.json', 'text/plain');
    }
//#endregion

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

  }