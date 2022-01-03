const axios = require('axios');
const config = require("./config.json");

// https://github.com/log4js-node/log4js-node
// trace, debug, info, warn, error, fatal
const log4js = require('log4js');
log4js.configure({
    appenders: { 
        "out": { type: 'stdout' },
        "file": { type: 'file', filename: config.logfile } },
    categories: { 
        default: { 
            appenders: ['out', 'file'], 
            level: config.loglevel 
        } 
    }
});

const logger = log4js.getLogger('hover-ddns');

async function update() {
    const baseUrl    = "https://www.hover.com/api/";
    const ipQueryUrl = "https://api.ipify.org"; //"https://bot.whatismyipaddress.com";

    const params = {
        username: config.username,
        password: config.password 
    }

    try { 
        let response = "";

        // Login to Hover with user credentials, save the first cookie (hoverauth)
        response = await axios.post(baseUrl + "login", params);

        const cookies = response.headers["set-cookie"];
        const cookieList = cookies.toString().split("; ");
        const hoverauthCookie = cookieList[0];
        
        // Get our external IP address
        logger.debug("GET ip Address: " + ipQueryUrl);
        response = await axios.get(ipQueryUrl);
        const myIP = response.data;
        logger.debug("My IP: " + myIP);

        // Get the current dns value for our hostname from Hover
        response = await axios.get(baseUrl + "dns", {
            headers: {
                Cookie: hoverauthCookie
            }
        });

        logger.debug("dns: " + JSON.stringify(response.data, null, 4));

        let currentIp = "";

        // Search all of the entry elements for our dns id ("dns12345678")
        //
        // response.data looks like:
        // {
        //     "succeeded": true,
        //     "domains": [
        //         {
        //             "domain_name": "domain.com",
        //             "id": "dom123456",
        //             "active": true,
        //             "entries": [
        //                 {
        //                     "id": "dns1234567",            <== this is the key we are after
        //                     "name": "@",                   <== @ is the base domain name, * are all subdomains
        //                     "type": "A",
        //                     "content": "64.98.145.30",     <== this is the value we need
        //                     "ttl": 900,
        //                     "is_default": true,
        //                     "can_revert": false
        //                  },
        //                  ... Aditional entries
        //              ]
        //         },
        //         ... Aditional domains
        //     ]
        //            
        // }
        for  (const domain of response.data.domains) {
            logger.debug(`Checking domain: ${domain.domain_name}`);
            for (const entry of domain.entries) {
                logger.debug(`  Checking entry: id: ${entry.id}, name: ${entry.name}, type: ${entry.type}`);
                if (entry.id === config.dnsId) {
                    logger.debug(`Found entry for ${entry.id}: ${JSON.stringify(entry, null, 4)}`);
                    currentIp = entry.content;                        
                }                
            }
        }

        if (currentIp === "") {
            logger.error(`Unable to find entry for: ${config.dnsId}`);
            return;
        } 

        // Do we we need to update the address
        if (myIP === currentIp) {
            logger.debug("DNS for " + config.dnsId + " is still: " + currentIp);
            return;
        } 

        logger.debug("DNS for " + config.dnsId + " was " + currentIp + " changing to: " + myIP); 
        
        // put the updated IP address to the Hover record.
        response = await axios.put(baseUrl + "dns/" + config.dnsId, "content=" + myIP, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Cookie": hoverauthCookie
            }
        })

        if (response.status === 200) {
            logger.info("DNS for " + config.dnsId + " was successfully changing to: " + myIP);
        }
    }
    catch(error) {
        logger.error("Error: " + error);
    }
}

logger.level = config.loglevel;

if (config.updatePeriod === 0) {
    logger.info("hover-ddns: Running once");
    update();
    return;
}

logger.info("hover-ddns: Starting update every " + config.updatePeriod + " seconds.");
update(); // Do it once now.
const updater = setInterval(update, config.updatePeriod * 1000);
