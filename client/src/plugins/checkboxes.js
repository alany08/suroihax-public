exports.addCheckbox = function(settingsVar="craplol", optionName, elementID, callback=false, callbackfn=undefined){
    const settings_menu = document.querySelector("#tab-aimbot-content");
    const checkboxHTML = `  
    <label>
        <span class="setting-title" style="color: red;">${optionName}</span>
        <input type="checkbox" id="${elementID}" data-var-name="${settingsVar}">
    </label>`;
    const checkbox = document.createElement("div");
    checkbox.setAttribute("class", "modal-item checkbox-setting");
    checkbox.innerHTML = checkboxHTML;
    settings_menu.insertBefore(checkbox, settings_menu.firstChild);
    const item = document.getElementById(elementID);
    document.getElementById(elementID).checked = window.aimbot_var.settings[settingsVar];
    item.addEventListener("click", function(e){
        if(callback){
            console.log("calling function");
            callbackfn();
        }
        else{
            console.log("toggling", settingsVar);
            window.aimbot_var.settings[settingsVar] = !window.aimbot_var.settings[settingsVar];
        }
    }.bind(this));
}