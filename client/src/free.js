const { default_settings } = require("./defaultSettings.js");

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
        "switch_after": -1,
        "aimbot_override": {
            "enabeled": false,
            "status": false
        },
        "team_identifier": "ABCD",
        "kills": 0,
        "old_kills": 0,
        "auto_emote_interval": 0,
        "auto_emote_counter": 0,
        "mypos": {
            new: {
                "x": 0,
                "y": 0
            },
            old: {
                "x": 0,
                "y": 0
            },
            dt: 1,
            time: Date.now()
        },
        "enemy_velocities": {},
        "is_mobile": false
    },
    "game": null,
    "api_base": "suroihax.glitch.me"
}

//detect is it mobile
window.aimbot_var.data.is_mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
if(window.aimbot_var.data.is_mobile){
    //load the plugin to clean up the UI and stuffs
    require("./plugins/mobileUi.js");
    //window.location.href = "https://google.com/"
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

//const showkillcount = require("./plugins/alwaysKillCount.js");
//showkillcount.init();
//kinda pointless

const autoemote = require("./plugins/autoEmote.js");
autoemote.init();

//const highlightcrates = require("./plugins/lootNotif.js");
//highlightcrates.init();
//import this in esp

/*const performanceoverlay = require("./plugins/performanceOverlay.js");
performanceoverlay.init();

//all this stuff for timing is required for debug overlay

const loops = {
    "esp+": esp,
    "flst": flashlight,
    "grti": grenadetimer,
    "swid": switchindicator,
    "qwsw": quickswitch,
    "perf": performanceoverlay,
    "aimb": aimbot
}

const timer = {
    "<u>TOTAL</u>": {
        "time": 0,
        "max": 0
    },
    "<u>SCRIPT TOTAL</u>": {
        "time": 0,
        "max": 0
    },
    "<u>SUROI TOTAL</u>": {
        "time": 0,
        "max": 0
    }
}

const mainLoop = function(){
    /*
    esp.loop();
    flashlight.loop();
    //autoloot.loop();
    aimbot.loop();
    grenadetimer.loop();
    //spectatebot.loop();
    switchindicator.loop();
    quickswitch.loop();
    * /
    let _start = performance.now();
    Object.keys(loops).forEach((e) => {
        let start = performance.now();
        if(e == "perf"){
            loops[e].loop(timer);
        }
        else{
            loops[e].loop();
        }
        let end = performance.now();
        if(!timer[e]){
            timer[e] = new Object();
        }
        if(!timer[e].max){
            timer[e].max = 0;
        }
        timer[e].time = end - start;
        if(end - start > timer[e].max){
            timer[e].max = end - start
        }
    });
    let _end = performance.now();
    timer["<u>SCRIPT TOTAL</u>"].time = _end - _start;
    if(_end - _start > timer["<u>SCRIPT TOTAL</u>"].max){
        timer["<u>SCRIPT TOTAL</u>"].max = _end - _start;
    }
}.bind(this);

const _oldReqAnimationFrame = window.requestAnimationFrame;

//must do it here, the fps unlock
addCheckbox("uncap_fps", "Uncapped FPS", "uncap-fps");

window.requestAnimationFrame = function(){
    mainLoop();
    let cb = arguments[0];
    var newCb = function(){
        let start = performance.now();
        cb();
        let end = performance.now();
        timer["<u>SUROI TOTAL</u>"].time = end - start;
        if(end - start > timer["<u>SUROI TOTAL</u>"].max){
            timer["<u>SUROI TOTAL</u>"].max = end - start;
        }
        let totaltime = timer["<u>SCRIPT TOTAL</u>"].time + timer["<u>SCRIPT TOTAL</u>"].time;
        timer["<u>TOTAL</u>"].time = totaltime;
        if(totaltime > timer["<u>TOTAL</u>"].max){
            timer["<u>TOTAL</u>"].max = totaltime;
        }
    }.bind(this);
    if(window.aimbot_var.settings.uncap_fps){
        return setTimeout(newCb, 1);
    }
    else{
        return _oldReqAnimationFrame(newCb);
    }
    return "requestAnimationFrame failed to get uncapped FPS status...";
}.bind(this);
*/

window.mainLoop = function(){
    esp.loop();
    flashlight.loop();
    //autoloot.loop();
    aimbot.loop();
    //highlightcrates.loop();
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
//bypass ban LMFAo
//require("./plugins/banBypass.js");
//incidentally patched, requires a succeeded getGame request within 5s to join game
