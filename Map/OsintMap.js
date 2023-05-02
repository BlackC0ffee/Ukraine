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

        const renderFunctions = ['addNewPolygon']; // Functions that require the Render to run at the end needs to be added to this list.

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
        return true;
    }

    addNewPolygon(name, color){
        console.log('Running addNewPolygon');
        this.#activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(this.#pol, {color: color, stroke: true}).addTo(this._map) }
        //this._map.activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(this._pol, {color: color, stroke: true}).addTo(map) }
        this.#listOfPolygons.push(this.#activePolygon);
        //this._map.listOfPolygons.push(this._map.activePolygon);
        //BuildPolygonList();
        //EnableCrosshair();
        //if(document.getElementById("selectPolygonButton").textContent == "On"){ document.getElementById("selectPolygonButton").dispatchEvent(new Event('click')); }
        //if(document.getElementById("strokeButton").value == "Off"){ document.getElementById("strokeButton").dispatchEvent(new Event('click')); }
    }

    returnStats(){
        if(this.#stats){
            const nodecounter = 10
            // this.#listOfPolygonslistOfPolygons.forEach(element => {
            //     if(element.polygon){
            //         nodecounter += element.polygon._latlngs[0].length;
            //     }
            // });
            //stats.textContent = "Number of Polygons: " + globalThis.listOfPolygons.length + "\rNumber of nodes: " + nodecounter; 
            stats.textContent = "Number of Polygons: " + "\rNumber of nodes: " + nodecounter; 
        }
        return true
        // list = document.getElementById('PolygonsList');
        // for (i = list.length - 1; i >= 0; i--) {
        //     list.remove(i);
        // }
    
        // for (let index = 0; index < listOfPolygons.length; index++) {
        //     opt = document.createElement("option");
        //     opt.text = listOfPolygons[index].name;
        //     opt.value = listOfPolygons[index].id; //Index might be better
        //     list.options.add(opt);
        // }
    
        //Stats
        // stats = document.getElementById('stats');
        // nodecounter = 0
        // globalThis.listOfPolygons.forEach(element => {
        //     if(element.polygon){
        //         nodecounter += element.polygon._latlngs[0].length;
        //     }
        // });
        // stats.textContent = "Number of Polygons: " + globalThis.listOfPolygons.length + "\rNumber of nodes: " + nodecounter;
    }

    updatePolygonList(){ // old name BuildPolygonList
        
        var polygonList = document.createElement("select")
        var opt;
        polygonList.id = "NewPolygonsList"
        polygonList.size = "10"
   
        for (let index = 0; index < this.#listOfPolygons.length; index++) {
            opt = document.createElement("option");
            opt.text = this.#listOfPolygons[index].name;
            opt.value = this.#listOfPolygons[index].id; //Index might be better
            polygonList.options.add(opt);
        }

        this.#debugDiv.appendChild(polygonList);
    }

  }