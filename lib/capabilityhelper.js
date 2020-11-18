'use strict';
class CapabilityHelper {
    constructor() {
    }

    getCapabilities(controlGroup) {
        let capabilities = [];

        return new Promise((resolve, reject) => {

            if(controlGroup === undefined){
                resolve(capabilities);
            }

            if(controlGroup.group === undefined){
                resolve(capabilities);
            }
            controlGroup.forEach((group) => {
                if (group.name === "Power") {
                    capabilities.push('onoff');
                }

                if (group.name === "Home") {
                    group.function.forEach((command) => {
                        if (command.name === "PowerOn") {
                            capabilities.push('onoff');
                        }

                        if (command.name === "PowerToggle") {
                            capabilities.push('onoff');
                        }
                    });
                }

                if (group.name === "Volume") {
                    group.function.forEach((command) => {
                        if (command.name === "Mute") {
                            capabilities.push('volume_mute');
                        }

                        if (command.name === "VolumeDown") {
                            capabilities.push('volume_down');
                        }

                        if (command.name === "VolumeUp") {
                            capabilities.push('volume_up');
                        }
                    });
                }

                if (group.name === "Channel") {
                    group.function.forEach((command) => {
                        if (command.name === "ChannelDown") {
                            capabilities.push('channel_down');
                        }

                        if (command.name === "ChannelUp") {
                            capabilities.push('channel_up');
                        }
                    });
                }
            });
            resolve(capabilities);
        });
    }
}
module.exports = CapabilityHelper;