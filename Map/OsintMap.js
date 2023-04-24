class OsintMap {
    constructor(map) {
        if(map instanceof L.Map){
            this.map = map;
        }else{
            return false;
        }
    }

    listOfPolygons = new Array();
    activePolygon;

    addNewPolygon(name, color){
        activePolygon = {id: (new Date().getTime()), name: name, polygon: L.polygon(pol, {color: color, stroke: true}).addTo(map) }
        listOfPolygons.push(activePolygon);
        BuildPolygonList();
        EnableCrosshair();
        if(document.getElementById("selectPolygonButton").textContent == "On"){ document.getElementById("selectPolygonButton").dispatchEvent(new Event('click')); }
        if(document.getElementById("strokeButton").value == "Off"){ document.getElementById("strokeButton").dispatchEvent(new Event('click')); }
    }

    render(){
        return true;
    }

  }