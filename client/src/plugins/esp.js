const calc = require("./calc.js");
const grenadewarning = require("./grenadeWarning.js");
const { addCheckbox } = require("./checkboxes.js");
const lootNotif = require("./lootNotif.js");

Object.assign(exports, {
    init: function(){
        this.canvas = window.aimbot_var.data.overlay_canvas = document.createElement("canvas");
        this.canvas.style.zIndex = "999999";
        this.canvas.style.pointerEvents = "none";
        this.canvas.style.position = "absolute";
        this.canvas.style.left = "0px";
        this.canvas.style.top = "0px";
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        window.onresize = function(){
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }.bind(this);
        document.body.appendChild(this.canvas);
        this.context = window.aimbot_var.data.canvas_ctx = this.canvas.getContext("2d");
        grenadewarning.init();
        addCheckbox("hide_smoke", "Hide smoke", "hide-smoke");
        addCheckbox("hide_obstacles", "Hide obstacles (non-collidable)", "hide-obstacles");
        addCheckbox("lock_downed", "Lock Downed Players", "lock-downed");
        addCheckbox("aimlock_indestructable", "Aimlock through indestructables", "aimlock-indest");
        addCheckbox("aimlock_destructable", "Aimlock through destructables", "aimlock-destruct");
        //init here pls
        lootNotif.init();
    },
    clearOverlay: function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    makeSmokeInvisible: function(){
        try {
            if (aimbot_var.settings.hide_smoke) {
                Array.from(window.aimbot_var.game.objects._byCategory[8]).forEach(function(particle) {
                    let smoke = window.aimbot_var.game.objects.get(particle.id);
                    if (smoke.image.alpha > window.aimbot_var.settings.smoke_alpha) {
                        smoke.image.alpha = window.aimbot_var.settings.smoke_alpha;
                    }
                });
            }
        } catch {}
    },
    makeObsInvisible: function() {
        try {
            if (aimbot_var.settings.hide_obstacles) {
                Array.from(window.aimbot_var.game.objects._byCategory[1]).forEach(function(obj) {
                    if (obj.definition.noCollisions || ["pine_tree", "oak_tree", "birch_tree", "maple_tree", "small_oak_tree"].includes(obj.definition.idString)) {
                        obj.image.alpha = window.aimbot_var.settings.obstacle_alpha;
                    }
                });
            }
        } catch {}
    },
    lineOfSightDestructable: function(pos) {
        if (!window.aimbot_var.settings.aimlock_destructable) {
            return calc.lineOfSightDestructable(pos);
        } else {
            return true;
        }
    },
    lineOfSightIndestructable: function(pos) {
        if (!window.aimbot_var.settings.aimlock_indestructable) {
            return calc.lineOfSightIndestructable(pos);
        } else {
            return true;
        }
    },
    loop: function() {
        this.clearOverlay();
        lootNotif.loop(); //helper here bc canvas stuff is handled here
        //var old_enemies = structuredClone(window.aimbot_var.data.enemies);
        window.aimbot_var.data.enemies = {};

        if (window.aimbot_var.game) {
            const center = [Math.round(this.canvas.width / 2), Math.round(this.canvas.height / 2)];
            let drawInstructions = [];

            Array.from(window.aimbot_var.game.objects._byCategory[0]).forEach(function(e) {
                let pos = calc.calcPosOnScreen(e.position);
                let name = "[SUROIHAX ERROR]";
                try {
                    name = window.aimbot_var.game.playerNames.get(e.id).name;
                } catch {}

                let isFriendly = (e.teamID == window.aimbot_var.game.activePlayer.teamID && window.aimbot_var.game.teamMode) || e.id == window.aimbot_var.game.activePlayerID;
                isFriendly = isFriendly || (window.aimbot_var.settings.same_name_friendly && name == window.aimbot_var.game.playerNames.get(window.aimbot_var.game.activePlayerId).name)
                let isSameLayer = e.layer == window.aimbot_var.game.activePlayer.layer;

                // Dead players - skip drawing
                if (e.dead) {
                    return;
                }

                if(!isFriendly){
                    // Determine visibility based on indestructible and destructible settings
                    var isVisible = (
                        this.lineOfSightIndestructable(e.position) || window.aimbot_var.settings.aimlock_indestructable
                    ) && (
                        this.lineOfSightDestructable(e.position) || window.aimbot_var.settings.aimlock_destructable
                    );
                } else {
                    var isVisible = true;
                }

                // Determine if player should be locked on
                let isLockable = (
                    !e.downed || 
                    window.aimbot_var.settings.lock_downed
                ) && !isFriendly;

                if ((!isVisible || !isSameLayer) && !isFriendly) {
                    drawInstructions.push({ type: "grey", pos, strokeColor: "white", name });
                } else if (isLockable && isVisible && isSameLayer) {
                    //console.log("Old enemy present");
                    //console.log(old_enemies[e.id].new, e.position)
                    window.aimbot_var.data.enemies[e.id] = {
                        new: e.position,
                        old: e._oldPosition || e.position,
                        dt: Date.now() - e._lastPositionChange,
                    };
                    //console.log(window.aimbot_var.data.enemies[e.id])
                    drawInstructions.push({ type: "red", pos, strokeColor: "red", name });
                } else if (!isFriendly) {
                    // Player is on a different layer, downed, or hidden
                    drawInstructions.push({ type: "grey", pos, strokeColor: "white", name });
                } else if (isFriendly){
                    drawInstructions.push({ type: "box", pos, strokeColor: "green",  name });
                }

                // Draw the nametag only for valid enemies
                if (!isFriendly && !e.dead) {
                    drawInstructions.push({ type: "nametag", pos, name });
                }

            }.bind(this));

            // Drawing all instructions at once
            drawInstructions.forEach(instruction => {
                const { type, pos, strokeColor, name } = instruction;
                this.context.beginPath();
                const sideL = 80 * window.aimbot_var.game.camera.container.localTransform.a;

                if (type === "red" || type === "grey") {
                    this.context.lineWidth = 1;
                    this.context.strokeStyle = strokeColor;
                    this.context.moveTo(center[0], center[1]);
                    this.context.lineTo(pos.x, pos.y);
                    this.context.stroke();
                    this.context.strokeRect(pos.x - sideL / 2, pos.y - sideL / 2, sideL, sideL);
                } else if (type === "nametag") {
                    this.context.font = "bold 20px sans-serif";
                    const tWidth = this.context.measureText(name).width;
                    this.context.fillStyle = "black";
                    this.context.fillText(name, Math.round(pos.x - tWidth / 2), pos.y - (window.aimbot_var.game.camera.container.localTransform.a * 100));
                } else if (type === "box") {
                    this.context.lineWidth = 1;
                    this.context.strokeStyle = strokeColor;
                    this.context.strokeRect(pos.x - sideL / 2, pos.y - sideL / 2, sideL, sideL);
                }
            });

            this.makeSmokeInvisible();
            this.makeObsInvisible();

            try {
                window.aimbot_var.data.canvas_ctx.beginPath();
                window.aimbot_var.data.canvas_ctx.arc(window.aimbot_var.data.fakemousepos[0], window.aimbot_var.data.fakemousepos[1], 7, 0, 2 * Math.PI, false);
                window.aimbot_var.data.canvas_ctx.strokeStyle = "red";
                window.aimbot_var.data.canvas_ctx.stroke();
                window.aimbot_var.data.canvas_ctx.beginPath();
                window.aimbot_var.data.canvas_ctx.arc(window.aimbot_var.data.fakemousepos[0], window.aimbot_var.data.fakemousepos[1], 3, 0, 2 * Math.PI, false);
                window.aimbot_var.data.canvas_ctx.fillStyle = "red";
                window.aimbot_var.data.canvas_ctx.fill();
                window.aimbot_var.data.canvas_ctx.stroke();
            } catch {}

            grenadewarning.loop();
        }
    }
});
