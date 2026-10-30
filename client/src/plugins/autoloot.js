const { addCheckbox } = require("./checkboxes.js");
const calc = require("./calc.js");

Object.assign(exports, {
    init: function(){
        addCheckbox("autoloot", "Autoloot/Interact", "autoloot");
    },
    loop: function(){
        try{
            if(window.aimbot_var.settings.autoloot && window.aimbot_var){
                //dont loot if u just dropped a gun
                if(performance.now() - window.aimbot_var.data.last_drop_time > 1000){
                    let ordered = Array.from(window.aimbot_var.game.objects._byCategory[3])
                    ordered.sort((a, b) => {
                        let dista = calc.distance([a._position.x, a._position.y], [window.aimbot_var.game.activePlayer.position.x, window.aimbot_var.game.activePlayer.position.y]);
                        let distb = calc.distance([b._position.x, b._position.y], [window.aimbot_var.game.activePlayer.position.x, window.aimbot_var.game.activePlayer.position.y]);
                        return dista - distb;
                    });
                    let closest_object = ordered[0];
                    if(closest_object && performance.now() - window.aimbot_var.data.last_action > 50){
                        if(calc.distance([closest_object._position.x, closest_object._position.y], [window.aimbot_var.game.activePlayer.position.x, window.aimbot_var.game.activePlayer.position.y]) < window.aimbot_var.settings.loot_radius){
                            //ammo, throwables, healing items, scopes
                            if([1, 3, 4, 7].includes(closest_object.definition.itemType)){
                                //scopes don't have a specified max amnt, i just set it as 1 by default
                                if(window.aimbot_var.game.uiManager.inventory.items[closest_object.definition.idString] < (window.aimbot_var.game.activePlayer.equipment.backpack.maxCapacity[closest_object.definition.idString] || 1)){
                                    window.aimbot_var.game.console.handleQuery("interact");
                                    window.aimbot_var.data.last_action = performance.now()
                                    //may accidentally loot gun if nearby
                                }
                            }
                            //guns
                            if(closest_object.definition.itemType == 0){
                                if(!window.aimbot_var.game.uiManager.inventory.weapons[0] || !window.aimbot_var.game.uiManager.inventory.weapons[1]){
                                    window.aimbot_var.game.console.handleQuery("interact");
                                    window.aimbot_var.data.last_action = performance.now()
                                    //either slot is empty
                                }
                            }
                            //melee
                            if(closest_object.definition.itemType == 2){
                                if(window.aimbot_var.game.uiManager.inventory.weapons[2].definition.idString == "fists"){
                                    window.aimbot_var.game.console.handleQuery("interact");
                                    window.aimbot_var.data.last_action = performance.now()
                                }
                            }
                            //equipment
                            if(closest_object.definition.itemType == 5){
                                closest_object.definition.level
                                if(closest_object.definition.armorType == 1){
                                    if(closest_object.definition.level > (!window.aimbot_var.game.activePlayer.equipment.vest ? 0 : window.aimbot_var.game.activePlayer.equipment.vest.level)){
                                        window.aimbot_var.game.console.handleQuery("interact");
                                        window.aimbot_var.data.last_action = performance.now()
                                    }
                                }
                                if(closest_object.definition.armorType == 0){
                                    if(closest_object.definition.level > (!window.aimbot_var.game.activePlayer.equipment.helmet ? 0 : window.aimbot_var.game.activePlayer.equipment.helmet.level)){
                                        window.aimbot_var.game.console.handleQuery("interact");
                                        window.aimbot_var.data.last_action = performance.now()
                                    }
                                }
                            }
                            //backpacks
                            if(closest_object.definition.itemType == 6){
                                if(closest_object.definition.level > window.aimbot_var.game.activePlayer.equipment.backpack.level){
                                    window.aimbot_var.game.console.handleQuery("interact");
                                    window.aimbot_var.data.last_action = performance.now()
                                }
                            }
                        }
                    }
                }
                //exceptions, for doors
                if(document.querySelector("#interact-text").innerText.toLowerCase().includes("door")){
                    //don't spam it
                    if(performance.now() - window.aimbot_var.data.last_action > 250){
                        window.aimbot_var.game.console.handleQuery("interact");
                        window.aimbot_var.data.last_action = performance.now();
                    }
                }
            }
        } catch{}
    }
})