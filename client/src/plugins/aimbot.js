const { addCheckbox } = require("./checkboxes.js");
const calc = require("./calc.js");
Object.assign(exports, {
    toggleShoot: function(){
        if(
            (window.aimbot_var.game?.activePlayer?.activeItem?.fireMode || 0) == 0 &&
            window.aimbot_var.data?.attacking
        ){
            window.aimbot_var.game.inputManager.attacking = !window.aimbot_var.game.inputManager.attacking;
        }
        if(window.aimbot_var.data.attacking && window.aimbot_var.data.last_gun != window.aimbot_var.game.activePlayer.activeItem.idString){
            console.log("gun switched, and still attacking");
            if([1, 2].includes(window.aimbot_var.game.activePlayer.activeItem.fireMode)){
                window.aimbot_var.game.inputManager.attacking = false;
                setTimeout(function(){
                    window.aimbot_var.game.inputManager.attacking = true;
                }, 50);
            }
        }
        if(window.aimbot_var.data.attacking && window.aimbot_var.game.activePlayer.activeItem.itemType != 3 /*throwables*/){
            setTimeout(this.toggleShoot.bind(this), (window.aimbot_var.game.activePlayer.activeItem.fireDelay || window.aimbot_var.game.activePlayer.activeItem.cooldown)/5);
        }
        window.aimbot_var.data.last_gun = window.aimbot_var.game.activePlayer.activeItem.idString;
    },
    init: function(){
        addCheckbox("same_name_friendly", "Same Name = Friendly?", "same-name-friendly");
        addCheckbox("aimlock_type", "Aim to most similar angle?", "aimlock-type");
        addCheckbox("disengage_melee", "Disengage melee when low health", "disengage-melee");
        addCheckbox("lock_with_fists", "Aimlock with fists out", "lock-with-fists");
        addCheckbox("melee_lock_attack_center", "Melee lock with attack center", "lock-attack-center");
        function refreshUI(){
            var aimbot_text = document.querySelector("#aimbot-status");
            //aimbot_text.innerText = ("started UI refresh")
            var text_1 =  `<span id="suroihax-aimbot-toggle">(${window.aimbot_var.settings.keybinds.toggle_aimbot}) Aimbot ${window.aimbot_var.settings.aimbot_enabeled ? "ON" : "OFF"}</span>\n`;
            var text_2 = `<span id="suroihax-melee-toggle">(${window.aimbot_var.settings.keybinds.toggle_melee}) Melee ${window.aimbot_var.settings.melee_lock_enabeled ? "ON" : "OFF"}</span>\n`;
            var text_3 = `<span id="suroihax-coeff-drag">(${window.aimbot_var.settings.keybinds.increase_coeff}/${window.aimbot_var.settings.keybinds.decrease_coeff}) ` + window.aimbot_var.settings.aim_ahead.toString() + "</span>\n";
            //aimbot_text.innerText = ("built text")
            try{
                let ws = URL.parse(window.aimbot_var.data.last_ws_url);
                if(ws){
                    let region = ws.host.split(".")[1].toUpperCase();
                    let gameid = ws.host.split(".")[0];
                    var text_4 = `Region: ${region}\nGame: ${gameid}`;
                }
            } catch {text_4 = ""}
            //aimbot_text.innerText = ("built ws text")
            //console.log((text_1 + text_2 + text_3 + text4).replaceAll("\n", "<br />"))
            aimbot_text.innerHTML = (text_1 + text_2 + text_3 + text_4).replaceAll("\n", "<br />");
            //register onclick to toggle stuffs
            document.getElementById("suroihax-aimbot-toggle").addEventListener("click", (e) => {
                window.aimbot_var.settings.aimbot_enabeled = !window.aimbot_var.settings.aimbot_enabeled;
            });
            document.getElementById("suroihax-melee-toggle").addEventListener("click", (e) => {
                window.aimbot_var.settings.melee_lock_enabeled = !window.aimbot_var.settings.melee_lock_enabeled;
            });
            //aimbot_text.innerText = ("registered event listeners")
            /*var coeff_el = document.getElementById("suroihax-coeff-drag");
            coeff_el.addeventListener("touchstart", (e) => {
                
            });*/
            //add this drag stuffs later
        }
        refreshUI();
        //start off with all the event listeners
        function keydown(evt){
            switch(evt.key.toLowerCase()){
                case "w":
                    window.aimbot_var.data.current_movements.up = true;
                case "a":
                    window.aimbot_var.data.current_movements.left = true;
                case "s":
                    window.aimbot_var.data.current_movements.down = true;
                case "d":
                    window.aimbot_var.data.current_movements.right = true;
            }
            if(evt.key.toLowerCase() == window.aimbot_var.settings.keybinds.toggle_aimbot){
                window.aimbot_var.settings.aimbot_enabeled = !window.aimbot_var.settings.aimbot_enabeled;
            }
            //these get you instabanned
            /*
            if(evt.key.toLowerCase() == "b"){
                //window.aimbot_var.settings.spinbot_enabeled = !window.aimbot_var.settings.spinbot_enabeled
            }
            if(evt.key.toLowerCase() == "c"){
                //window.aimbot_var.settings.spam_emotes = !window.aimbot_var.settings.spam_emotes;
            }*/
            if(evt.key.toLowerCase() == window.aimbot_var.settings.keybinds.toggle_melee){
                window.aimbot_var.settings.melee_lock_enabeled = !window.aimbot_var.settings.melee_lock_enabeled;
            }
            if(evt.key == window.aimbot_var.settings.keybinds.decrease_coeff){
                window.aimbot_var.settings.aim_ahead -= 0.05;
                window.aimbot_var.settings.aim_ahead = parseFloat(window.aimbot_var.settings.aim_ahead.toFixed(2));
            }
            if(evt.key == window.aimbot_var.settings.keybinds.increase_coeff){
                window.aimbot_var.settings.aim_ahead += 0.05
                window.aimbot_var.settings.aim_ahead = parseFloat(window.aimbot_var.settings.aim_ahead.toFixed(2));
            }
            //put that in a diff func
            refreshUI();
        }
        function keyup(evt){
            switch(evt.key.toLowerCase()){
                case "w":
                    window.aimbot_var.data.current_movements.up = false;
                case "a":
                    window.aimbot_var.data.current_movements.left = false;
                case "s":
                    window.aimbot_var.data.current_movements.down = false;
                case "d":
                    window.aimbot_var.data.current_movements.right = false;
            };
        }
        document.documentElement.addEventListener("keyup", keyup);
        document.documentElement.addEventListener("keydown", keydown);
        document.documentElement.addEventListener("click", refreshUI);
        function mouseDown(evt){
            try{
                if(evt.which == 1){
                    console.log("begin aimbot");
                    window.aimbot_var.data.attacking = true;
                    if((window.aimbot_var.game.activePlayer.activeItem.fireMode || 0) == 0){
                        window.aimbot_var.game.inputManager.attacking = !window.aimbot_var.game.inputManager.attacking;
                    }
                    this.toggleShoot();
                }
                else if(evt.which == 3){
                    window.aimbot_var.data.last_drop_time = performance.now();
                    console.log("rightclick");
                }
            }
            catch {
                console.log("Error initiating aimbot");
            }
        }
        window.addEventListener("pointerdown", mouseDown.bind(this));
        function mouseUp(evt){
            if(evt.which == 1){
                console.log("aimbot disengaged");
                window.aimbot_var.data.attacking = false;
            }
        }
        window.aimbot_var.data.self_coords = [0,0];
        window.aimbot_var.data.mousepos = [0,0];
        function mouseMove(evt){
            window.aimbot_var.data.mousepos = [event.clientX, event.clientY];
        }
        //fixed mousemove not responding
        document.documentElement.addEventListener("pointermove", mouseMove.bind(this));
        window.addEventListener("pointerup", mouseUp.bind(this));
    },
	loop: function(){
        //update my own position
        if(window.aimbot_var?.game?.activePlayer){
            window.aimbot_var.data.mypos.old = structuredClone(window.aimbot_var.data.mypos.new);
            window.aimbot_var.data.mypos.new = {
                "x": window.aimbot_var.game.activePlayer.position.x,
                "y": window.aimbot_var.game.activePlayer.position.y
            }
            window.aimbot_var.data.mypos.dt = Date.now() - window.aimbot_var.data.mypos.time;
            window.aimbot_var.data.mypos.time = Date.now();
        }

        try{
            this._tmp_distances = {};
            var mypos = {};
            Object.assign(mypos, window.aimbot_var.game.activePlayer.position);

            //This is to calculate melee radius center offset
            var meleeItem = window.aimbot_var.game.uiManager.inventory.weapons[2].definition;
            var meleeRadius = (calc.distance([0,0], [meleeItem.offset.x, meleeItem.offset.y]) + meleeItem.radius + 2.25 + window.aimbot_var.settings.melee_lock_radius_boost); //Also add player radius, to hit enemy player. Don't use the settings value anymore, use this radius from now on
            if(window.aimbot_var.settings.melee_lock_attack_center){
                var rotation = window.aimbot_var.game.inputManager.rotation;
                if(rotation < 0){
                    rotation += Math.PI*2;
                }
                rotation = 2*Math.PI - rotation;
                var offsetX = meleeItem.offset.x * Math.cos(rotation) + meleeItem.offset.y * Math.sin(rotation);
                var offsetY = - meleeItem.offset.x * Math.sin(rotation) + meleeItem.offset.y * Math.cos(rotation);
            }
            else{
                offsetX = 0;
                offsetY = 0;
            }

            var original_mypos = {};
            Object.assign(original_mypos, mypos);
            mypos.x += offsetX;
            mypos.y += offsetY;

            var enemy = null;
            var min_dist = Infinity;
            var min_dist_optimal = Infinity;
            var this_tick_melee_active = false;
            Object.values(window.aimbot_var.data.enemies).forEach(function(e){
                var dist = calc.distance([original_mypos.x, original_mypos.y], [e.new.x, e.new.y]);
                if(dist < min_dist){
                    min_dist = dist;
                    enemy = e;
                }
            }.bind(this));
        } catch{}

        if(Object.keys(window.aimbot_var.data.enemies).length != 0){
            if(window.aimbot_var.data.attacking && min_dist <= meleeRadius && window.aimbot_var.settings.aimbot_enabeled && window.aimbot_var.settings.melee_lock_enabeled){
                window.aimbot_var.data.melee_enabeled = true;
                this_tick_melee_active = true;
                this.toggleShoot();
                if(window.aimbot_var.game.uiManager.inventory.activeWeaponIndex != 2 && !window.aimbot_var.data.active_item_cache){
                    window.aimbot_var.data.active_item_cache = window.aimbot_var.game.uiManager.inventory.activeWeaponIndex;
                    console.log("caching last used gun before entering melee lock");
                }
                if(performance.now() - window.aimbot_var.data.last_action > 50){
                    //spamming glitches out the aimbot
                    window.aimbot_var.game.console.handleQuery("slot 2");
                    window.aimbot_var.data.last_action = performance.now();
                }
                var enemy_relative = [enemy.new.x - mypos.x, mypos.y - enemy.new.y];
                var angle = Math.atan2(enemy_relative[1], enemy_relative[0]);
                window.aimbot_var.game.inputManager.movement.up =
                    window.aimbot_var.game.inputManager.movement.left =
                    window.aimbot_var.game.inputManager.movement.right =
                    window.aimbot_var.game.inputManager.movement.down = false;
                //overlapping for diagonal movement, it just works lol
                //pull off when low hp
                if(
                    window.aimbot_var.game.uiManager.health < window.aimbot_var.settings.melee_min_health &&
                    window.aimbot_var.settings.disengage_melee &&
                    typeof window.aimbot_var.data.active_item_cache == 'number'
                ){
                    angle += Math.PI;
                }
                //compensating for angle less than 0
                if(angle < 0){
                    angle += 2*Math.PI;
                }
                if(angle > Math.PI/8 && angle < 7*Math.PI/8){
                    window.aimbot_var.game.inputManager.movement.up = true;
                }
                if(angle > 5*Math.PI/8 && angle < 11*Math.PI/8){
                    window.aimbot_var.game.inputManager.movement.left = true;
                }
                if(angle > 9*Math.PI/8 && angle < 15*Math.PI/8){
                    window.aimbot_var.game.inputManager.movement.down = true;
                }
                if(angle > 13*Math.PI/8 || angle < 3*Math.PI/8){
                    window.aimbot_var.game.inputManager.movement.right = true;
                }
            }
            if(!this_tick_melee_active){
                //if the melee lock hasn't already picked up an enemy
                Object.keys(window.aimbot_var.data.enemies).forEach(function(e){
                    var pos = [window.aimbot_var.data.enemies[e].new.x, window.aimbot_var.data.enemies[e].new.y];
                    var realpos = calc.calcPosOnScreen(window.aimbot_var.data.enemies[e].new);
                    //literal distance from mouse, target closest player to mouse
                    realpos = [realpos.x, realpos.y];
                    //change to angle_dist
                    var dist = window.aimbot_var.settings.aimlock_type ? calc.angleDist([realpos[0]-window.innerWidth/2, realpos[1]-window.innerHeight/2], [window.aimbot_var.data.mousepos[0]-window.innerWidth/2, window.aimbot_var.data.mousepos[1]-window.innerHeight/2]) : calc.distance(window.aimbot_var.data.mousepos, realpos);
                    this._tmp_distances[dist] = e;
                }.bind(this));
                var distances = Object.keys(this._tmp_distances);
                var _tmp = distances[0];
                distances.forEach(function(dist){
                    if(parseFloat(dist) < _tmp){
                        _tmp = dist;
                    }
                }.bind(this));
                target = this._tmp_distances[_tmp]; //target is the enemy id, then pull from the data
                enemy = window.aimbot_var.data.enemies[target];
            }
            var target_id = target
            var target = enemy;
            //too lazy to rename the variable everywhere, enemy is used in melee above, target for aimlock
            //simple linear aim ahead by current velocity, only aims assums bullet travel time = 1 tick, may compensate later
            //add variation with actual distance later, and add gun velocity detection
            
            /*
            var n = calc.calcPosOnScreen(target.new);
            try{
                var o = calc.calcPosOnScreen(target.old);
            } catch{o = n /*o is probably undef, and the player hasnt moved for a while* /}
            var enemy_dist = calc.distance([window.aimbot_var.game.activePlayer.position.x, window.aimbot_var.game.activePlayer.position.y], [target.new.x, target.new.y]);
            var weapon_speed = !window.aimbot_var.game.activePlayer.activeItem.ballistics ? 0.1 : window.aimbot_var.game.activePlayer.activeItem.ballistics.speed;
            let fps = window.aimbot_var.game.pixi.ticker.FPS;
            var temp = [
                n.x + (n.x - o.x)*(enemy_dist**window.aimbot_var.settings.exp)*window.aimbot_var.settings.coeff/weapon_speed,
                n.y + (n.y - o.y)*(enemy_dist**window.aimbot_var.settings.exp)*window.aimbot_var.settings.coeff/weapon_speed
            ];*/
            var mypos = window.aimbot_var.data.mypos.new;
            let myposold = window.aimbot_var.data.mypos.old || mypos;
            let dt = window.aimbot_var.data.mypos.dt;
            //dt = 20; //constant dt bc isnt that the tick rate is it???
            //todo: multi lerp
            var player = {
                "x": mypos.x + (myposold.x - mypos.x) * dt,
                "y": mypos.y + (myposold.y - mypos.y) * dt
            }
            var ve = {
                "x": (target.old.x - target.new.x)/target.dt,
                "y": (target.old.y - target.new.y)/target.dt
            }

            //lerp the velocities - push them into the tracked array
            if(!window.aimbot_var.data.enemy_velocities[target_id]){
                window.aimbot_var.data.enemy_velocities[target_id] = {
                    "x": [ve.x],
                    "y": [ve.y]
                }
            }
            else{
                window.aimbot_var.data.enemy_velocities[target_id].x.push(ve.x);
                if(window.aimbot_var.data.enemy_velocities[target_id].x.length > window.aimbot_var.settings.vel_lerp_ct){
                    window.aimbot_var.data.enemy_velocities[target_id].x.shift()
                }
                window.aimbot_var.data.enemy_velocities[target_id].y.push(ve.y);
                if(window.aimbot_var.data.enemy_velocities[target_id].y.length > window.aimbot_var.settings.vel_lerp_ct){
                    window.aimbot_var.data.enemy_velocities[target_id].y.shift()
                }
            }

            //redef with lerped
            ve = {
                "x": calc.mean(window.aimbot_var.data.enemy_velocities[target_id].x),
                "y": calc.mean(window.aimbot_var.data.enemy_velocities[target_id].y)
            }

            var bulletspeed = (window.aimbot_var.game.activePlayer.activeItem?.ballistics?.speed || 0.1) * 200 //into units/milisecond
            var barrel_length = window.aimbot_var.game.activePlayer.activeItem.length;
            var ping = window.aimbot_var.game.netGraph.ping._stats.mean; //this is average, just use it hahah
            var enemy = {
                "x": target.new.x,
                "y": target.new.y
            }

            //quadratic ax^2+bx+c
            var quadratic = {
                "a": bulletspeed**2 - ve.x**2 - ve.y**2, //neg vex and vey? bc square on right side
                "b": 2*enemy.x*ve.x + 2*enemy.y*ve.y - 2*player.x*ve.x - 2*player.y*ve.y, //should negate or not?
                "c": -(enemy.x**2 + player.x**2 + enemy.y**2 + player.y**2)
            }
            //console.log(bulletspeed, ve, enemy, player, quadratic);
            //this whole thing is in terms of t, set equal to zero
            var time = calc.solvePositiveRoot(quadratic);
            if (!time) time = 0;
            if (barrel_length) time = time - barrel_length/bulletspeed; //compensate for the included time of the barrel length traversal
            if (time < 0 && barrel_length) time = time + barrel_length/bulletspeed; //player's barrel is over the enemy, we should be melee locking???

            time = time + ping;
            //console.log(time);

            var temp = [
                enemy.x - ve.x * time * window.aimbot_var.settings.aim_ahead,
                enemy.y - ve.y * time * window.aimbot_var.settings.aim_ahead
            ];

            temp = calc.calcPosOnScreen({
                "x": temp[0],
                "y": temp[1]
            });
            temp = [
                temp.x,
                temp.y
            ]

            let fps = window.aimbot_var.game.pixi.ticker.FPS;
            //still need fps for lerping

            temp = [
                (
                    temp[0] +
                    window.aimbot_var.settings.lerp_weight*fps*window.aimbot_var.data.fakemousepos[0]
                )/
                (1 + window.aimbot_var.settings.lerp_weight*fps),
                (
                    temp[1] +
                    window.aimbot_var.settings.lerp_weight*fps*window.aimbot_var.data.fakemousepos[1]
                )/
                (1 + window.aimbot_var.settings.lerp_weight*fps)
            ];
            /*
            switch(window.transition.type){
                case 0:
                    window.transition.to = window.mousepos;
                case 1:
                    window.transition.to = window.aimbot_var.data;
            }
            let weight = (performance.now() -  window.transition.start)/window.transition_time;
            if(weight > 1){
                window.transition.active = false;
            }
            if(window.transition.active){
                temp[0] = window.transition.from[0] + (temp[0] - window.transition.from[0])*weight;
                temp[1] = window.transition.from[1] + (temp[1] - window.transition.from[1])*weight;
            }
            */
            //tbd, is it really worth it?? do it for soft-lock aiming algo, when dtheta < threshold instantly lock
            //errors with NaN and inf
            if(!isFinite(temp[0])){
                temp[0] = window.aimbot_var.data.fakemousepos[0];
                console.log("aimbot error, preserving previous value...");
                console.log(`
                    Quadratic: ${quadratic}
                    Position: ${position}
                    Enemy Pos: ${player}
                    Enemy Vel: ${ve}
                    Barrel L: ${barrel_length}
                    Time: ${time}
                    Ping: ${ping}
                    FPS: ${fps}
                    Bullet Speed: ${bulletspeed}
                `)
            }
            if(!isFinite(temp[1])){
                temp[1] = window.aimbot_var.data.fakemousepos[1];
                console.log("aimbot error, preserving previous value...");
                console.log(`
                    Quadratic: ${quadratic}
                    Position: ${position}
                    Enemy Pos: ${player}
                    Enemy Vel: ${ve}
                    Barrel L: ${barrel_length}
                    Time: ${time}
                    Ping: ${ping}
                    FPS: ${fps}
                    Bullet Speed: ${bulletspeed}
                `)
            }
            if(
                ![2, 3].includes(window.aimbot_var.game.activePlayer.activeItem.itemType) || //not fists or grenades
                window.aimbot_var.settings.lock_with_fists || //or override and allow locking
                this_tick_melee_active //or melee lock is engaged this tick
            ){
                window.aimbot_var.data.aimbot_override.enabeled = false;
                window.aimbot_var.data.fakemousepos = [temp[0], temp[1]];
            }
            else{
                //disable aimbot if we're not gonna set fakemousepos, avoids confusion :D
                window.aimbot_var.data.aimbot_override.enabeled = true;
                window.aimbot_var.data.aimbot_override.status = false;
            }
            //bruh
            if(!isFinite(window.aimbot_var.data.fakemousepos[0])){
                window.aimbot_var.data.fakemousepos[0] = 0;
                console.log("aimbot error, preserving previous value...");
            }
            if(!isFinite(window.aimbot_var.data.fakemousepos[1])){
                window.aimbot_var.data.fakemousepos[1] = 0;
                console.log("aimbot error, preserving previous value...");
            }
        }
        //min dist is undefined!
        //wont run if no enemies, put it here
        try{
            if(min_dist > meleeRadius || !min_dist || !window.aimbot_var.settings.melee_lock_enabeled){
                if(typeof window.aimbot_var.data.active_item_cache == 'number'){
                    console.log("restoring previous gun");
                    window.aimbot_var.game.console.handleQuery("slot " + window.aimbot_var.data.active_item_cache.toString());
                    window.aimbot_var.data.active_item_cache = null;
                    //not working for some reason, maybe the window.aimbot_var.data.attacking variable isn't working
                    if(window.aimbot_var.data.attacking){
                        window.aimbot_var.game.inputManager.attacking = false;
                        setTimeout(function(){
                            window.aimbot_var.game.inputManager.attacking = true;
                        }, 100);
                    }
                }
                if(window.aimbot_var.data.melee_enabeled){
                    console.log("resuming normal movement");
                    window.aimbot_var.game.inputManager.movement.up =
                        window.aimbot_var.game.inputManager.movement.left =
                        window.aimbot_var.game.inputManager.movement.right =
                        window.aimbot_var.game.inputManager.movement.down = false;
                    setTimeout(function(){
                        Object.assign(window.aimbot_var.game.inputManager.movement, window.aimbot_var.data.current_movements);
                    }, 100);
                }
                window.aimbot_var.data.melee_enabeled = false;
            }
        } catch {}
	}
});
