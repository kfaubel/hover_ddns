# hover_ddns
Simple applicaiton to update DNS setting with the current external (routable) IP address

Adapted from the basic flow found here: https://gist.github.com/andybarilla/b0dd93e71ff18303c059 . 

## Installation
````
$ git clone https://github.com/kfaubel/hover_ddns.git
$ cd hover_ddns
$ npm install hover_ddns
````

## Get values you will need
login to hover.com
navigate to https://www.hover.com/api/domains/YOURDOMAIN.COM/dns
Get the id value:
````
{
    "succeeded": true,
    "domains": [
    {
        "domain_name": "YOURDOMAIN.COM",
        "id": "dom123456",                      <== Not this id
        "active": true,
            "entries": [
                {
                    "id": "dns1234567",         <== This is the value we are looking for
                    "name": "@",
                    "type": "A",
                    "content": "100.101.102.103",
                    "ttl": 900,
                    "is_default": true,
                    "can_revert": false
                },

    ...
````

## Update the config file
Edit the config.json file with your ID, username and password

## Run
This can be added to an /etc/rc.local file on a Linux system (Raspberry Pi) with a line like this:
````
sudo cd /home/pi/server/hover_ddns && npm start &
````
Or from the command line in the node_ddns directory:

````
$ npm start
````


