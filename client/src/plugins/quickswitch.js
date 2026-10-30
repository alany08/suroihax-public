const { addCheckbox } = require("./checkboxes.js");

Object.assign(exports, {
    init: function(){
        addCheckbox("quickswitch", "Auto Quickswitch", "quickswitch");
    },
    loop: function(){
        try {
            const inventory = window.aimbot_var.game.uiManager.inventory;
            const activePlayer = window.aimbot_var.game.activePlayer;
            const currentSlot = inventory.activeWeaponIndex + 1; // Slots are 1-indexed (slot 1, slot 2)
            const currentGun = activePlayer.activeItem;
            const weapons = inventory.weapons;

            // Ensure quickswitch is enabled and we have the required data
            if (!window.aimbot_var.settings.quickswitch || !currentGun || !inventory.weapons) return;

            // Check the conditions for guns in slots 1 and 2
            const weapon1 = weapons[0];
            const weapon2 = weapons[1];
            const isSingleFire1 = weapon1 && (weapon1.fireDelay || 0) > 350 && weapon1.fireMode != 2;
            const isSingleFire2 = weapon2 && (weapon2.fireDelay || 0) > 350 && weapon2.fireMode != 2;

            const hasOneSingleFire = (isSingleFire1 && !weapon2) || (isSingleFire2 && !weapon1);
            const hasTwoGunsOneSingleFire = (isSingleFire1 && weapon2 && !isSingleFire2) || (isSingleFire2 && weapon1 && !isSingleFire1);
            const hasTwoSingleFireGuns = isSingleFire1 && isSingleFire2;

            // Buffer time for switching, considering WebSocket delays
            const bufferTime = 100; // Adjust this value as needed
            const switchBackDelay = (currentGun.fireDelay || 1000) * 0.75; // 3/4 of the fire delay

            // If it's time to switch again, perform switching logic
            if (performance.now() > window.aimbot_var.data.switch_after) {
                // Track whether we've already switched to avoid overlapping commands
                if (!window.aimbot_var.data.isSwitching) {
                    if (window.aimbot_var.game.inputManager.attacking) {
                        if (hasOneSingleFire) {
                            // Only one single-fire gun, switch to fists (slot 3) and back
                            window.aimbot_var.data.isSwitching = true;
                            setTimeout(() => {
                                window.aimbot_var.game.console.handleQuery("slot 3"); // Switch to fists
                                setTimeout(() => {
                                    window.aimbot_var.game.console.handleQuery("slot " + currentSlot); // Switch back to the gun after 3/4 of the fire delay
                                    window.aimbot_var.data.isSwitching = false; // Reset switching flag
                                }, switchBackDelay + bufferTime); // Buffer time to switch back to the gun
                            }, bufferTime); // Buffer time for switching to fists
                        } else if (hasTwoGunsOneSingleFire) {
                            // Two guns, one is single-fire, switch to the other gun and back
                            const nextSlot = currentSlot === 1 ? 2 : 1; // Switch between slot 1 and slot 2
                            window.aimbot_var.data.isSwitching = true;
                            setTimeout(() => {
                                window.aimbot_var.game.console.handleQuery("slot " + nextSlot); // Switch to the other gun
                                setTimeout(() => {
                                    window.aimbot_var.game.console.handleQuery("slot " + currentSlot); // Switch back to the original gun after 3/4 of fire delay
                                    window.aimbot_var.data.isSwitching = false; // Reset switching flag
                                }, switchBackDelay + bufferTime);
                            }, bufferTime); // Buffer time for initial switch
                        } else if (hasTwoSingleFireGuns) {
                            // Two single-fire guns, alternate between them according to cooldowns
                            const nextSlot = currentSlot === 1 ? 2 : 1; // Toggle between slot 1 and slot 2
                            const switchBackTime = Math.max(weapon1.fireDelay, weapon2.fireDelay) * 0.75; // Use 3/4 of maximum fire delay
                            window.aimbot_var.data.isSwitching = true;
                            setTimeout(() => {
                                window.aimbot_var.game.console.handleQuery("slot " + nextSlot); // Switch to the other gun
                                setTimeout(() => {
                                    window.aimbot_var.game.console.handleQuery("slot " + currentSlot); // Switch back after delay
                                    window.aimbot_var.data.isSwitching = false; // Reset switching flag
                                }, switchBackTime + bufferTime); // Delay based on max fire delay
                            }, bufferTime);
                        }

                        // Update timing to prevent rapid switching
                        window.aimbot_var.data.last_switch_time = performance.now();
                        window.aimbot_var.data.switch_after = performance.now() + currentGun.fireDelay + 200; // Adjust timing based on fire delay and buffer
                    }
                }
            }
        } catch (e) {
            // Handle any errors silently to prevent console spam
        }
    }
});
