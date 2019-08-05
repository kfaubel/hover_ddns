const axios = require('axios');
const config = require("./config.json");

const dnsId = "dns19334064";

async function login() {
    const url = "https://www.hover.com/api/login";
    const params = {
        username: config.username,
        password: config.password,
        'Content-Type': "application/x-www-form-urlencoded"
    }

    let hoverauthCookie = "";
    await axios.post(url, params)
    .then((response) => {
        // handle success
        //console.log(JSON.stringify(response.data, null, 4));
        //console.log(JSON.stringify(response.headers, null, 4));

        // hoverauth=be2db073567c657394dcff1f5d8213f2; path=/,hover_session=109ed51feb959d6ffcb8100609ab9eca; path=/; HttpOnly
        const cookies = response.headers["set-cookie"];
        console.log("cookies: " + cookies);
        const cookieList = cookies.toString().split("; ");
        const hoverauthCookie = cookieList[0];

        console.log("hoverauth: " + hoverauthCookie);

        axios.post("http://bot.whatismyipaddress.com")
        .then((response) => {
            const myIP = response.data;
            console.log("My IP: " + myIP);

            axios.get("https://www.hover.com/api/dns", {
                headers: {
                    Cookie: hoverauthCookie
                }
            })
            .then((response) => {
                //console.log("dns: " + JSON.stringify(response.data, null, 4));

                let currentIp = "";

                for  (const domain of response.data.domains) {
                    //console.log("domain: " + JSON.stringify(domain, null, 4));
                    //console.log("domain.id: " + JSON.stringify(response.data.domains[domain].id, null, 4));
                    for (const entry of domain.entries) {
                        //console.log("entry: " + JSON.stringify(entry, null, 4));
                        if (entry.id === config.dnsId) {
                            if (myIP === entry.content) {
                                console.log("DNS for " + config.dnsId + " is still: " + entry.content);
                            } else {
                                console.log("entry: " + JSON.stringify(entry, null, 4));
                                console.log("DNS for " + config.dnsId + " changed to: " + entry.content);
                                const updateUrl = "https://www.hover.com/api/dns/" + config.dnsId;


                                // https://www.hover.com/api/dns/dns3663904?content=64.98.145.30
                                // https://www.hover.com/api/dns/dns19334064?content=199.4.160.88
                                console.log("Update URL: " + updateUrl);

                                axios.put(updateUrl, "content=" + myIP, {
                                    headers: {
                                        "Content-Type": "application/x-www-form-urlencoded",
                                        "Cookie": hoverauthCookie
                                    }
                                })
                                .then((response) => {
                                    console.log("Update successful!");
                                })
                            }
                            
                        }
                        
                    }
                }



            })
        })

    })
    .catch((error) => {
        // handle error
        console.log("Error: " + error);
    })
    .finally(() => {
        // always executed
    });

}

login();