
const dropdown = document.getElementById("myDropDown")
let style = dropdown.value;

dropdown.addEventListener("change", function () {
    style = dropdown.value;
    map.setStyle(style)
});

const map = new maplibregl.Map({
    container: "map", // container id
    hash: true,
    style: "../styles/style_VVM_grey_v1.json",
    maplibreLogo: true,
    attributionControl: false, // Disable default if preferred
});
// map.showCollisionBoxes = true;
// map.showPadding = true;
    map.setStyle(style)

const nav = new maplibregl.NavigationControl();

const attributionControl = new maplibregl.AttributionControl({
    customAttribution:
        '<a target="blank" href="https://nieneb.nl">This Way Cartography</a>',
});
map.addControl(attributionControl);

// Insert layer ID here for click information
map.on("click", [
    "BRT-Waterdeelvlak",
    "BRT-Terreinvlak-bebouwd-gebied",
    "BRT-Terreinvlak-groen",
    "BRT-Terreinvlak-geel",
    "BRT-spoorbaanlijn",
    "BGT-overbruggingsdeel",
    "BGT-onbegroeidterreindeel",
    "BGT-waterdeel",
    "BGT-begroeidterreindeel",
    "BAG-gebouwen",
    "OSM-pois-1"], (e) => {
        for (let i = 0; i < e.features.length; i++) {
            console.log(`${e.features[i].source} :  ${e.features[i].sourceLayer}`, e.features[i].properties);
        }
    });
map.addControl(nav, "top-right");

const popup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false
});

map.on("mousemove", (e) => {
    const features = map.queryRenderedFeatures(e.point);
    if (features.length === 0) {
        map.getCanvas().style.cursor = "";
        popup.remove();
        return;
    }
    map.getCanvas().style.cursor = "pointer";
    const feature = features[0];
    const props = Object.entries(feature.properties)
        .map(([k, v]) => `<tr><td><b>${k}</b></td><td>${v}</td></tr>`)
        .join("");
    const html = `<div>
        <strong>${feature.source} : ${feature.sourceLayer}</strong>
        <table style="font-size:12px;margin-top:4px">${props}</table>
    </div>`;
    popup.setLngLat(e.lngLat).setHTML(html).addTo(map);
});

function toggleGroupLayers(group) {
    let style = map.getStyle();
    style.layers.forEach((layer) => {
        if (layer.metadata.group === group) {
            toggleLayer(layer.id);
        }
    });
}

function toggleLayer(layerId) {
    let visibility = map.getLayoutProperty(layerId, "visibility") || "visible";
    map.setLayoutProperty(
        layerId,
        "visibility",
        visibility === "none" ? "visible" : "none",
    );
    document.getElementById(layerId).checked =
        visibility === "none" ? true : false;
}

function returnColors(type, paint) {
    if (!paint) return;
    let paintType;
    if (type === "raster") {
        return;
    }
    switch (type) {
        case "symbol":
            paintType = "text-color";
            // or icon-color ..
            break;
        default:
            paintType = `${type}-color`;
            break;
    }

    if (paint[paintType] && Array.isArray(paint[paintType])) {
        let legendDivGroup = document.createElement("div");
        if (paint[paintType][0] === "match") {
            for (let i = 3; i < paint[paintType].length; i += 2) {
                let legendDiv = document.createElement("div");
                legendDiv.className = "legendDiv";
                legendDiv.style.backgroundColor = paint[paintType][i];
                legendDivGroup.append(legendDiv);
            }
            return legendDivGroup;
        } else if (paint[paintType][0] === "interpolate") {
            for (let i = 4; i < paint[paintType].length; i += 2) {
                let legendDiv = document.createElement("div");
                legendDiv.className = "legendDiv";
                legendDiv.style.backgroundColor = paint[paintType][i];
                legendDivGroup.append(legendDiv);
            }
            return legendDivGroup;
        }
    } else {
        let legendDiv = document.createElement("div");
        legendDiv.className = "legendDiv";
        legendDiv.style.backgroundColor = paint[paintType];
        return legendDiv;
    }
}

function loadTOC() {
    const styleObj = map.getStyle();
    console.log(styleObj);

    const elemDiv = document.getElementById("toc");
    while (elemDiv.firstChild) {
        elemDiv.removeChild(elemDiv.firstChild);
    }

    const groups = [];
    styleObj.layers.forEach((layer) => {
        console.log(layer.id);
        // console.log(layer.metadata.insertBefore);
        if (layer.metadata && layer.metadata.group) {
            if (!groups.includes(layer.metadata.group)) {
                groups.push(layer.metadata.group);
            }
        }
    });
    if (groups.length === 0) {
        groups.push("all")
    }
    groups.forEach((group) => {
        let groupDiv = document.createElement("div");

        let groupName = document.createElement("h2");
        groupName.append(group);
        groupName.addEventListener("click", () => {
            toggleGroupLayers(group);
        });
        groupName.className = "clickableLayer";

        groupDiv.append(groupName);

        styleObj.layers.forEach((layer) => {
            let layerDiv = document.createElement("div");
            layerDiv.className = "clickableLayer";

            let inputBox = document.createElement("input");
            inputBox.checked =
                layer.layout?.visibility === "none" ? "" : "checked";
            inputBox.type = "checkbox";
            inputBox.addEventListener("click", () => {
                toggleLayer(layer.id);
            });
            inputBox.id = layer.id;

            layerDiv.append(inputBox);

            let layerLabel = document.createElement("label");
            if (!layer.metadata) {
                layerLabel.innerHTML = `<p><b>${layer.id}</b>`
                let legendDiv = returnColors(layer.type, layer.paint);
                layerDiv.append(layerLabel);
                layerDiv.append(legendDiv);
                groupDiv.append(layerDiv);
            }

            if (layer.metadata && layer.metadata.group && layer.metadata.group === group) {
                layerLabel.innerHTML = `<p><b>${layer.id}</b> 
                        </br> ${layer.metadata.legendName ? layer.metadata.legendName : ""} 
                        </br> <i>${layer.metadata.desc ? layer.metadata.desc : ""} </i></p>`;
                let legendDiv = returnColors(layer.type, layer.paint);
                layerDiv.append(layerLabel);
                layerDiv.append(legendDiv);
                groupDiv.append(layerDiv);

            }


        });
        elemDiv.append(groupDiv);
    });
    // document.body.appendChild(elemDiv);
}
// Creating layer overview and descriptions
map.on("style.load", () => {
    loadTOC()

});

