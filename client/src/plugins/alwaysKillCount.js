const { addCheckbox } = require("./checkboxes.js");

Object.assign(exports, {
    init: function(){
        addCheckbox("always_kill_count", "Always show kill count", "always-kill-count");
        setInterval(this.showCounter, 100);
    }, 
    showCounter: function(){
        var killCounter = document.getElementById('kill-counter');
        if (killCounter) {
            killCounter.style.display = window.aimbot_var.settings.always_kill_count ? "" : "none";
        }
    }
});