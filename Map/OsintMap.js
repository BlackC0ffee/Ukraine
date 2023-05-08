class OsintMap {
    
    #pol = new Array();
    #listOfPolygons = new Array();
    #activePolygon;
    #stats;
    #debugDiv;

    constructor(map) {
        if(map instanceof L.Map){
            this._map = map;
        }else{
            return false;
        }

        const renderFunctions = ['addNewPolygon', 'onMapClick']; // Functions that require the Render to run at the end needs to be added to this list.

        this._pol = new Array();
        this._listOfPolygons = new Array();
        this._activePolygon;


        // Iterate over the function names and wrap each one
        for (const functionName of renderFunctions) {
            if (typeof this[functionName] === 'function') {
                this[functionName] = this.#wrapFunction(this[functionName]);
            }
        }
    }

    set stats(value){
        this.#stats = value
    }

    set debugDiv(value){
        this.#debugDiv = value
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

    addNewPolygon(name, color){
        console.log('Running addNewPolygon');
        this.#activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(this.#pol, {color: color, stroke: true}).addTo(this._map) }
        //this._map.activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(this._pol, {color: color, stroke: true}).addTo(map) }
        this.#listOfPolygons.push(this.#activePolygon);
        map.on('click', this.onMapClick);
        //if(document.getElementById("selectPolygonButton").textContent == "On"){ document.getElementById("selectPolygonButton").dispatchEvent(new Event('click')); }
        //if(document.getElementById("strokeButton").value == "Off"){ document.getElementById("strokeButton").dispatchEvent(new Event('click')); }
    }

    onMapClick(e) {
        let latlng;
        if(snapping){
            latlng = findClosetNode(e); // TOADD
        }else{
            latlng = e.latlng;
        }
        this.#pol.push([latlng.lat,latlng.lng]);
    }

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

  }