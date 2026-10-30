const { addCheckbox } = require("./checkboxes.js");

Object.assign(exports, {
    init: function(){
        addCheckbox("debug_overlay", "Debug performance overlay", "debug-overlay");
        let overlayDiv = document.createElement("div");
        overlayDiv.style.position = "absolute";
        overlayDiv.style.top = "0px";
        overlayDiv.style.left = "0px";
        overlayDiv.style.zIndex = "99999999";
        overlayDiv.style.fontSize = "15px";
        overlayDiv.style.display = "none";
        overlayDiv.style.padding = "3px";
        overlayDiv.style.color = "black";
        overlayDiv.style.backgroundColor = "white";
        overlayDiv.id = "performance-overlay-el";
        document.body.appendChild(overlayDiv);
    },
    loop: function(timer){
        let overlayDiv = document.getElementById("performance-overlay-el");
        overlayDiv.style.display = window.aimbot_var.settings.debug_overlay ? "block" : "none";
        var curr_html = "";
        Object.keys(timer).forEach((m) => {
            curr_html = curr_html + `<tt><b>${m}:</b> t=${timer[m].time.toFixed(2)}; m=${timer[m].max.toFixed(2)}</tt><br />`;
        });
        overlayDiv.innerHTML = curr_html;
    }
})