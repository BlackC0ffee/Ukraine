class OsintMap {
    #pol = new Array();
    #listOfPolygons = new Array();
    #buttonFunctions = {};
    #activePolygon; #snapping; #stats; #debugDiv; #newPolygonBlock; #colorList; #polygonName; #editPolygonBlock;
    #mainMenuBlock; #openFile; #newPolygonButton; #Reader; #objectTypeField; #objectNameField; #editButton; #downloadFileButton; #removeButton;
    #doneButton; #snapButton; 
    #subMenuBlock; #innerSubMenuBlocks;
    #colorListEdit; #polygonNameEdit

    constructor(map) {
        if(map instanceof L.Map){
            this._map = map;
            this._map.doubleClickZoom.disable();
        }else{
            return false;
        }

        const renderFunctions = ['addNewPolygon', 'onMapClick', 'importJsonData', 'makePolygonActive', 'removeActiveObject', 'undoPolygonNode', 'colorChange', 'nameChange']; // Functions that require the Render to run at the end needs to be added to this list.

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
        this.colorChange = this.colorChange.bind(this);
        this.nameChange = this.nameChange.bind(this);
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
        this.#removeButton = this.#mainMenuBlock.querySelector('#removeButton');
        this.addButtonFunction('openFileButton',this.openFileClick);
        this.#openFile.addEventListener('change',this.openFileChange);

        this.addButtonFunction('downloadFileButton', this.exportDataToJson);
        this.addButtonFunction('removeButton', this.removeActiveObject);

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
        <p>Name: <input type="text" name="polygonName" id="polygonNameEdit"></p>
        <p>Color: <select id="colorListEdit">
            <option value="#FFB400">Contested</option>
            <option value="#004BFF">Ukraine</option>  
            <option value="#C80000">Russia</option>
        </select></p>
        <p><button id="undoButton">Undo</button> | Snap: <input type="button" value="Off" id="snapButton"> | <button id="doneEditButton">Done</button></p>
        `;
        this.#editPolygonBlock.style.display = 'none';
        this.#snapButton = this.#editPolygonBlock.querySelector('#snapButton');
        this.addButtonFunction('editButton',this.editButtonClick);
        this.addButtonFunction('doneEditButton', this.donePolygonEdit);
        this.addButtonFunction('snapButton', this.snapToggle);
        this.addButtonFunction('undoButton', this.undoPolygonNode);
        this.#colorListEdit = this.#editPolygonBlock.querySelector('#colorListEdit');
        this.#colorListEdit.addEventListener('change', this.colorChange);

        this.#polygonNameEdit = this.#editPolygonBlock.querySelector('#polygonNameEdit');
        this.#polygonNameEdit.addEventListener('change', this.nameChange)
    }

    set subMenuBlock(value){
        this.#subMenuBlock = value;
        this.showBlock(this.#subMenuBlock, 'none');
        this.#subMenuBlock.innerHTML = `
        <p id='polygonSubMenu'>Stroke: <input type="button" value="On" id="strokeButton"></p>
        <p id='lineSubMenu'>Line</p>
        `;
    }

    updateSubMenuBlock(){
        let subMenus = this.#subMenuBlock.getElementsByTagName("p");
        Array.from(subMenus).forEach(element => {
            element.style.display = 'none';
        });

        if(this.#activePolygon){
            this.showBlock(this.#subMenuBlock, 'block');
            switch (this.#activePolygon.type) {
                case 'polygon':
                    let strokeButton = this.#subMenuBlock.querySelector('#strokeButton');
                    this.#subMenuBlock.querySelector('#polygonSubMenu').style.display = 'block';
                    if(this.#activePolygon.polygon.options.stroke){strokeButton.value = 'On'} else{ strokeButton.value = 'Off' }
                    this.addButtonFunction('strokeButton', this.stroke)
                    break;
                default:
                    break;
            }
        }else{
            this.showBlock(this.#subMenuBlock, 'none');
        }
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
            this.#removeButton.disabled = false;
        }else{
            this.#editButton.disabled = true;
            this.#removeButton.disabled = true;
            this.#objectTypeField.innerHTML = '';
            this.#objectNameField.innerHTML = '';
        }

        this.updateSubMenuBlock();

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

    removeActiveObject(){
        for (let index = 0; index < this.#listOfPolygons.length; index++) {
            if(this.#listOfPolygons[index].id == this.#activePolygon.id){
                this.#listOfPolygons[index].polygon.remove();
                this.#listOfPolygons.splice(index, 1);
            }
        }
        this.#activePolygon = undefined;
        this.#pol = new Array();
    }

    makePolygonActive(polygonId){
        for (let index = 0; index < this.#listOfPolygons.length; index++) {
            if(this.#listOfPolygons[index].id == polygonId){
                this.#activePolygon = this.#listOfPolygons[index]
                this.#pol = new Array();
                this.#activePolygon.polygon._latlngs[0].forEach(element => { //TODO: replace with method getLatLngs()
                    this.#pol.push([element.lat,element.lng])
                });
            }     
        }
    }

//#endregion

//#region SubMenuRegion
    stroke(e){
        let currentvalue = e.currentTarget.value;
        if(currentvalue == "Off"){
        e.currentTarget.value="On";
        this.#activePolygon.polygon.setStyle({stroke: true})
        }else{
        e.currentTarget.value="Off";
        this.#activePolygon.polygon.setStyle({stroke: false})
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
                if(this.#activePolygon.id == element.id){ //this means that the makePolygonActive was succesfull
                    this.#polygonNameEdit.value = this.#activePolygon.name;
                    for (var i=0; i<this.#colorListEdit.length; i++){
                        if(this.#colorListEdit.options[i].value == this.#activePolygon.polygon.options.color){
                            this.#colorListEdit.options[i].selected = true;
                        }
                        
                    }
                } 
            }
        });
    }

    editButtonClick(){
        this.showBlock(this.#editPolygonBlock, 'block');
        map.on('click', this.onMapClick);
        this.toggleCrosshair('on');
        this.setColorListValue(this.#activePolygon);
    }

    donePolygonEdit(){
        this.showBlock(this.#editPolygonBlock, 'none');
        this.toggleCrosshair('off');
        map.off('click', this.onMapClick);
    }

    snapToggle(){
        this.#snapping = this.toggle(this.#snapping);
        if(this.#snapping){this.#snapButton.value = 'On'}else{this.#snapButton.value = 'Off'}
    }

    undoPolygonNode(){
        this.#pol.pop();
    }

    colorChange(){ //TODO merge with create new
        console.log('ColorChanged');
        if(this.#activePolygon){
            this.#activePolygon.polygon.setStyle({color: this.#colorListEdit.value});
        }
    }

    nameChange(){
        console.log('NameChanged');
        if(this.#activePolygon){
            this.#activePolygon.name = this.#polygonNameEdit.value;
        }
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
        this.#activePolygon = {id: (new Date().getTime()), type: 'polygon', name: name, polygon: L.polygon(this.#pol, {color: color, stroke: true}).addTo(this._map) }
        this.#listOfPolygons.push(this.#activePolygon);
        this.#activePolygon.polygon.on({ dblclick: this.dblclickOnPolygonEvent });
        map.on('click', this.onMapClick);
        this.toggleCrosshair('on');
        this.setColorListValue(this.#activePolygon);
        this.showBlock(this.#newPolygonBlock, 'none');
        this.showBlock(this.#editPolygonBlock, 'block');
    }

    onMapClick(e) {
        let latlng;
        if(this.#snapping){
            if(!(latlng = this.findClosetNode(e))){
                latlng = e.latlng;
            }
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
            let polygonCounter = 0;
            if(this.#listOfPolygons.length > 0){
                polygonCounter = this.#listOfPolygons.length;
                this.#listOfPolygons.forEach(element => {
                    if(element.polygon){
                        nodecounter += element.polygon._latlngs[0].length;
                    }
                });
            }
            stats.textContent = "Number of Polygons: " + polygonCounter  + "\rNumber of nodes: " + nodecounter;
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

        let activePolygons = this.#activePolygon.polygon.getLatLngs();
        let lastNode = activePolygons[0];[activePolygons[0].length - 1];
        this.#listOfPolygons.forEach(element => {
                let latLngs = element.polygon.getLatLngs();
                latLngs[0].forEach(element => {
                    if(lastNode.length == 0 || lastNode[0].lat != element.lat && lastNode[0].lng != element.lng){ // ignore previouse node
                        distance = e.latlng.distanceTo(element);
                        if(smallestDistance > distance){
                            smallestDistance = distance;
                            closestNode = element;
                        }
                    }
                });
        });
        if(closestNode){
            return { lat: closestNode.lat, lng: closestNode.lng } //only returns value if something is found
        }else{
            return false;
        }
    }

    toggleCrosshair(onOrOff){
        if(onOrOff == 'on'){
            L.DomUtil.addClass(map._container,'crosshair-cursor-enabled');
        }else if(onOrOff == 'off'){
            L.DomUtil.removeClass(map._container,'crosshair-cursor-enabled');
        }
    }

    toggle(boolean){
        if (typeof boolean === 'boolean'){
            return boolean === true ? false : true;
        }
    }

    setColorListValue(e){
        if(e){
            for (var i=0; i<this.#colorListEdit.length; i++){
                if(this.#colorListEdit.options[i].value == e.polygon.options.color){
                    this.#colorListEdit.options[i].selected = true;
                }
                
            }   
        }

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
            innerPolygon.polygon.on({ dblclick: this.dblclickOnPolygonEvent });
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