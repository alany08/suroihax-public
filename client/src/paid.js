const default_settings =    {
    "aimbot_enabeled": true,
    "exp": 0.695,
    "coeff": 0.19,
    "lerp_weight": 1/15,
    "melee_lock_dist": 8,
    "melee_lock_enabeled": true,
    "smoke_alpha": 0.07,
    "same_name_friendly": false,
    //false for dist, true for angle
    "aimlock_type": false,
    "autoloot": true,
    "rejoin_game": false,
    "flashlight": true,
    "grenade_timer": true,
    "grenade_warning": true,
    "obstacle_alpha": 0.5,
    "hide_obstacles": true,
    "hide_smoke": true,
    "switch_indicator": true,
    "same_game_chat": false,
    "disable_overlay": false,
    "lock_downed": false,
    "keybinds": {
        "toggle_aimbot": "v",
        "increase_coeff": "CapsLock",
        "decrease_coeff": "Shift",
        "toggle_melee": "z"
    },
    "quickswitch": false,
    "disengage_melee": true,
    "melee_min_health": 20,
    "aimlock_indestructable": false,
    "aimlock_destructable": true,
    "always_kill_count": true,
    "uncap_fps": false
}

if(localStorage.getItem("aimbot_settings")){
    var stored_settings = JSON.parse(localStorage.getItem("aimbot_settings"));
    Object.keys(default_settings).forEach(function(key){
        if(typeof stored_settings[key] == "undefined"){
            stored_settings[key] = default_settings[key];
            localStorage.setItem("aimbot_settings", JSON.stringify(stored_settings));
            console.log("new feature, adding the settings option for", key);
        }
    });
    //for new features
}
else{
    var stored_settings = default_settings;
}

var proxy = new Proxy(stored_settings, {
    set: function (target, key, value) {
        target[key] = value;
        console.log("settings changed");
        localStorage.setItem("aimbot_settings", JSON.stringify(window.aimbot_var.settings));
        return true;
    }
});

window.aimbot_var = {
    "settings": proxy,
    "data": {
        "active_item_cache": null,
        "melee_enabeled": false,
        "last_gun": "",
        "last_drop_time": 0,
        "last_action": 0,
        "last_ws_url": null,
        "overlay_canvas": null,
        "canvas_ctx": null,
        "enemies": {},
        "current_movements": {},
        "attacking": false,
        "self_coords": [0,0],
        "mousepos": [0,0],
        "fakemousepos": [0,0],
        "grenade_timer_started": false,
        "spectate_window": null,
        "spectatebot": false,
        //previous gun slot
        "previous_slot": -1,
        "last_switch_time": -1,
        "chat_socket": null,
        "switch_after": -1
    },
    "game": null
}

//utils
const { addCheckbox } = require("./plugins/checkboxes.js");

//setup ui
require("./plugins/ui.js");
require("./plugins/newsPosts.js");
require("./plugins/gameChat.js");

//some modules need ui to be setup
const aimbot = require("./plugins/aimbot.js");
aimbot.init();

const esp = require("./plugins/esp.js");
esp.init();

const flashlight = require("./plugins/flashlight.js");
flashlight.init();

//const autoloot = require("./plugins/autoloot.js");
//autoloot.init();

const grenadetimer = require("./plugins/grenadeTimer.js");
grenadetimer.init();

//const spectatebot = require("./plugins/spectate.js");

const switchindicator = require("./plugins/switchIndicator.js");
switchindicator.init();

const quickswitch = require("./plugins/quickswitch.js");
quickswitch.init();

const showkillcount = require("./plugins/alwaysKillCount.js");
showkillcount.init();

window.mainLoop = function(){
    esp.loop();
    flashlight.loop();
    //autoloot.loop();
    aimbot.loop();
    grenadetimer.loop();
    //spectatebot.loop();
    switchindicator.loop();
    quickswitch.loop();
}

window._requestAnimationFrame = window.requestAnimationFrame;

//must do it here, the fps unlock
addCheckbox("uncap_fps", "Uncapped FPS", "uncap-fps");

window.requestAnimationFrame = function(){
    try{
        window.mainLoop();
    } catch(e){
        console.error(e);
    }
    if(window.aimbot_var.settings.uncap_fps){
        return setTimeout(arguments[0], 1);
    }
    else{
        return window._requestAnimationFrame(...arguments);
    }
    return "requestAnimationFrame failed to get uncapped FPS status...";
}

//join the previous game lol
require("./plugins/rejoinGame.js");
//zoomhack
require("./plugins/zoomhack.js");
//live chat
require("./plugins/gameChat.js");