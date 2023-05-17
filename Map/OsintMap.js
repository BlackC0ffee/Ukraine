class OsintMap {
    #pol = new Array();
    #listOfPolygons = new Array();
    #buttonFunctions = {};
    #activePolygon; #snapping; #stats; #debugDiv; #newPolygonBlock; #colorList; #polygonName; #editPolygonBlock;

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

        this.#snapping = false; //Todo remove or change?
    }

    set stats(value){
        this.#stats = value
    }

    set debugDiv(value){
        this.#debugDiv = value
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
    }

    clickEvent(e){
        const buttonId = e.target.id;
        const buttonFunction = this.#buttonFunctions[buttonId];
        if (buttonFunction) {
          buttonFunction(e);
        }
    }

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