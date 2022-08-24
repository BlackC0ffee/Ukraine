function Polygon(Cordinates, Color) {
    this.Cordinates = Cordinates;
    this.Color = Color;
}

function onMapClick(e) {
    //polygon.remove();
    pol.push([e.latlng.lat,e.latlng.lng])
    textbx = document.getElementById('OutputBox');
    //textbx.value +=  e.latlng + "\n";
    textbx.value = pol
    polygon.setLatLngs(pol);
}

//latlng: v
//lat: 50.15050636899788
//lng: 31.129760742187504