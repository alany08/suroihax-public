const { default_settings } = require("../defaultSettings.js")

var aimbot_text = document.createElement("div");
aimbot_text.id = "aimbot-status";
aimbot_text.innerText = `(${window.aimbot_var.settings.keybinds.toggle_aimbot}) Aimbot ON
(${window.aimbot_var.settings.keybinds.toggle_melee}) Melee ON
(${window.aimbot_var.settings.keybinds.increase_coeff}/${window.aimbot_var.settings.keybinds.decrease_coeff}) ${window.aimbot_var.settings.aim_ahead}`;
aimbot_text.style.color = "red";
//aimbot_text.style.pointerEvents = "none";
aimbot_text.style.fontSize = "15px";
aimbot_text.style.zIndex = "99999";
aimbot_text.style.position = "absolute";
aimbot_text.style.top = "50%";
aimbot_text.style.userSelect = "none";
aimbot_text.style.left = "5px";
document.body.appendChild(aimbot_text);

const { addCheckbox } = require("./checkboxes.js");

//create a tab for aimbot settings
let tabSelector = document.createElement("button");
document.querySelector(".tab.active").setAttribute("class", "tab");
document.querySelector(".tab-content.active").style.display = "none";
tabSelector.setAttribute("class", "tab active");
tabSelector.setAttribute("id", "tab-aimbot");
tabSelector.style.color = "red";
tabSelector.innerText = "Aimbot";
let tabs = document.getElementById("settings-tab-bar");
tabs.insertBefore(tabSelector, tabs.firstChild);
let tabContent = document.createElement("div");
tabContent.id = "tab-aimbot-content";
tabContent.setAttribute("class", "tab-content");
tabSelector.addEventListener("click", function(e){
    Array.from(document.querySelectorAll(".tab-content")).forEach(function(element){
        element.style.display = "none";
        element.setAttribute("class", "tab-content");
    });
    Array.from(document.querySelectorAll(".tab")).forEach(function(element){
        element.setAttribute("class", "tab");
    });
    document.querySelector("#tab-aimbot-content").style.display = "";
    document.querySelector("#tab-aimbot-content").setAttribute("class", "tab-content active");
    document.querySelector("#tab-aimbot").setAttribute("class", "tab active")
});
let tabContainer = document.getElementById("settings-tabs");
tabContainer.insertBefore(tabContent, tabContainer.firstChild);

let resetSettings = document.createElement("div");
resetSettings.setAttribute("class", "modal-item");
resetSettings.innerHTML = `
<label>
    <span class="setting-title" style="color: red;">There may be some hidden settings, if you are encountering an error try <a id="reset-aimbot-settings">resetting</a> settings</span>
</label>
`;

tabContainer.appendChild(resetSettings);
document.getElementById("reset-aimbot-settings").addEventListener("click", function(e){
    const defaults = default_settings;
    Object.assign(window.aimbot_var.settings, defaults);
    localStorage.setItem("aimbot_settings", JSON.stringify(window.aimbot_var.settings));
    this.innerText = "success, reload to fully apply";
    setTimeout(function(){
        this.innerText = "resetting";
    }.bind(this), 1000);
});

addCheckbox("autoloot", "Autoloot", "autoloot")