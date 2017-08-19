# Homey Harmony Hub Support

This project is in very early stage of development. At the moment this project supports:
- Pairing of devices connected to the harmony hub
- A mobile card supporting the power toggle functionality of the device
- An action card for sending a specific command to the Harmony device using homey flows.

# Setup

Once the app is installed you can pair a device that is connected to the harmony hub:

![alt text](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/Device%20Pairing.gif "Device pairing")

After you have paired your device it will be available in the homey flow editor allowing you to send IR commands to this device:

![alt text](https://github.com/jreenen/com.jreenen.homeyharmonyhub/blob/master/assets/images/Device%20flow.gif "Using your device in homey flow manager")

# Future releases

At the moment there is no real roadmap but for the upcoming release you can expect the following:
- Support for Harmony Hub activities
- More flow cards (triggers, conditions, and actions)
- More device type icons (right now only GameConsoleWithDvd, television, stereo receiver, and PVR have a custom icon assigned) 

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

# Donations
If you like the work on this project please consider a donation. Of course, this is optional and you should in no way feel obligated to send a donation. The donations will be spent on buying a second Harmony Hub to support me testing a multi-hub situation.

[<img src="https://www.paypalobjects.com/en_GB/i/btn/btn_donate_SM.gif">](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=8LWS6UKUCHJNC)


# Used external library's

[swissmanu's harmonyhubjs-client](https://github.com/swissmanu/harmonyhubjs-client)

[swissmanu's harmonyhubjs-discover](https://github.com/swissmanu/harmonyhubjs-discover)



