# Homey Harmony Hub App

This project is in early stage of development. At the moment this project supports:
- Pairing of devices connected to the harmony hub
- A mobile card supporting the power toggle functionality of the device
- An action card for sending a specific command to the Harmony device using homey flows.
- Action cards for starting/stopping a hub activity
- Trigger cards for device is turned on/off
- Trigger cards for activity is started/stopped
- Syncing the device onoff state based on the current hub activity

# Donations
If you like the work on this project please consider a donation. Of course, this is optional and you should in no way feel obligated to send a donation. The donations will be spent on buying a second Harmony Hub to support me testing a multi-hub situation.

[<img src="https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif">](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8LWS6UKUCHJNC)

# Setup

Once the app is installed you can pair a device that is connected to the harmony hub:

### -1- Click on the plus on the homey Zones & Devices screen to add devices

![Adding a device](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Add_device.png?raw=true)

### -2- Select homey harmony hub

![Select homey harmony hub](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Select_homey_harmony_hub.png?raw=true)

### -3- Select the hub you want to start pairing on

![Select harmony hub for pairing](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Select_hub.png?raw=true)

### -4- Select all devices you want to pair

![Select devices for pairing](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Select_devices.png?raw=true)

### -5- Your devices are now paired

![Devices paired](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Devices_paired.png?raw=true)

# Setting up triggers

The following triggers are supported by this app:

- Activity started
- Activity stopped
- Device turned on
- Device turned off

## Activity started

To use this trigger drag the Homey Harmony Hub from the apps section to the when column
![Activity started setup](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Activity_started_trigger.png?raw=true)

This trigger exposes 2 tokens hub and activity. The hub token reports the hub name an activity was triggered on. The activity token reports the activity name an activity was triggered on.


## Activity stopped

To use this trigger drag the Homey Harmony Hub from the apps section to the when column
![Activity stopped setup](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Activity_stopped_trigger.png?raw=true)

This trigger exposes 2 tokens hub and activity. The hub token reports the hub name an activity was triggered on. The activity token reports the activity name an activity was triggered on.


## Device turned on

To use this triggegr drag the paired device from the devices section to the when column.
![Device turned on](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Device_turned_on_trigger.png?raw=true)

This trigger exposes 1 token hub. The hub token reports the hub name an activity was triggered on. 


## Device turned off

To use this triggegr drag the paired device from the devices section to the when column.
![Device turned off](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Device_turned_off_trigger.png?raw=true)

This trigger exposes 1 token hub. The hub token reports the hub name an activity was triggered on. 

# Setting up actions

The following actions are supported by this app:
- Start activity
- Stop activity
- Send command to device

## Start activity

To use this action drag the Homey Harmony Hub from the apps section to the then column
![Start activity](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Start_activity_action.png?raw=true)

Now specify the Harmony Hub on which you want to start your activity 
![Start activity specify hub](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Start_activity_action_select_hub.png?raw=true)

After you specified the hub you can select the activity you want to start
![Start activity specify activity](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Start_activity_action_select_activity.png?raw=true)


## Stop activity

To use this action drag the Homey Harmony Hub from the apps section to the then column
![Stop activity](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Stop_activity_action.png?raw=true)

Now specify the Harmony Hub on which you want to start your activity 
![Stop activity specify hub](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Stop_activity_action_select_hub.png?raw=true)

After you specified the hub you can select the activity you want to start
![Stop activity specify activity](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Stop_activity_action_select_activity.png?raw=true)


## Send command to device

To use this triggegr drag the paired device from the devices section to the then column.
![Send command to device](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Send_command_action.png?raw=true)

Now specify the control group your command is in
![Send command to device specify control group](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Send_command_action_select_control_group.png?raw=true)

After you specified the control group you can select the command you want to send to the selected device
![Send command to device specify command](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/documentation/Send_command_action_select_command_option.png?raw=true)


# Future releases

At the moment there is no real roadmap but for the upcoming release you can expect the following:
- Pick an icon you want to use for your device during pairing.
- Command send trigger card.
- ...... create an issue on Github with a Feature request label an who knows your feature will be in the next release!


# Why developing another homey harmony hub driver when there already is one available?

I am aware there is already a [great project](https://github.com/netactivenl/com.logitech.harmony.hub) with a working harmony hub driver. Because I would like to have a different pairing strategy which would be a fundamental difference I decided to start a project of my own.

# What does this app track?

This app uses Application Insights to track the following topics:
- Application errors, which help to solve issues
- Unknown device types, so I can add more icons in future releases, making it easier to find the device you are looking for in the Homey flow editor.

The information gathered is for debugging purposes only at no time will it be used for tracking personal information. 

# Contributing to this project
If you want to be a contributor for this project, you are very welcome! 

# Contact information
If you want to contact me the best way is joining the [athomcommunity](http://athomcommunity.slack.com) on slack and send a direct message to @jreenen.  

# Versioning
This app uses semantic versioning
- MAJOR version when you make incompatible API changes,
- MINOR version when you add functionality in a backwards-compatible manner, and
- PATCH version when you make backwards-compatible bug fixes.

For a detailed desceiption you can find the [documentation for semantic versioning here](http://semver.org/)

# Version history

### v1.2.0

For improved stability and future features, a new connection library has been written for the Homey Harmony App. 

If an activity has been started/stopped by an external source (e.g. the Logitech Harmony Remote), the app picks up on this event and updates the device states accordingly and triggers the applicable flow cards.

You can now use a flow condition card for your device to check if it is/isn't turned on.

### v1.1.1

Hotfix release, some users experiencing an error "Error: MAX_CLIENTS=6"

### v1.1.0 
Pairing of devices connected to the harmony hub
A mobile card supporting the power toggle functionality of the device
An action card for sending a specific command to the Harmony device using homey flows.
Action cards for starting/stopping a hub activity
Trigger cards for device is turned on/off
Trigger cards for activity is started/stopped
Syncing the device on-off state based on the current hub activity

### v1.0.0 

Initial release (never hit the Athom store)

# Used external library's

[swissmanu's harmonyhubjs-discover](https://github.com/swissmanu/harmonyhubjs-discover)



