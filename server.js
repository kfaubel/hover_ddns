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
            level: 'warn' 
        } 
    }
});

const logger = log4js.getLogger('hover-ddns');

async function update() {
    const baseUrl    = "https://www.hover.com/api/";
    const ipQueryUrl = "https://bot.whatismyipaddress.com";

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
        response = await axios.post(ipQueryUrl);
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
        for  (const domain of response.data.domains) {
            for (const entry of domain.entries) {
                logger.debug("entry: " + JSON.stringify(entry, null, 4));
                if (entry.id === config.dnsId) {
                    currentIp = entry.content;                        
                }                
            }
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
