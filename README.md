# hover_ddns
Simple applicaiton to update DNS setting with the current external (routable) IP address

Adapted from the basic flow found here: https://gist.github.com/andybarilla/b0dd93e71ff18303c059 . 

## Installation
````
$ git clone https://github.com/kfaubel/hover_ddns.git
$ cd hover_ddns
$ npm install hover_ddns
````

## Update the config file
Edit the config.json file with your Hover credentials

## Run
This can be added to an /etc/rc.local file on a Linux system (Raspberry Pi) with a line like this:
````
sudo cd /home/pi/server/hover_ddns && npm start &
````
Or from the command line in the node_ddns directory:

````
$ npm start
````


