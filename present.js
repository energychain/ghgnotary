module.exports = function(RED) {
    const lib = require("./lib.js");
    function present(config) {
     
        const isObject = function(payload) { if(Object.prototype.toString.call(payload).indexOf('Object') !== -1) return true; else return false; }
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            const app_wallet = await node.ghgwallet.getGhgWallet();

            const singleSend = async function(payload ) {      
                if(!isObject(payload.certificate)) {
                    payload.certificate = await node.ghgwallet.getCertificateById(payload.certificate);
                } else {
                    if(isObject(payload)) {
                        payload.certificate = payload;
                    } else {
                        payload.certificate =  await node.ghgwallet.getCertificateById(payload)
                    }
                }
                if(typeof payload.vptype == 'undefined') {
                    payload.vptype = "ghg";
                    if(typeof config.vptype !== 'undefined') {
                        payload.vptype = config.vptype;
                    }
                }
                payload = await app_wallet.app.getPresentation(payload.certificate,payload.vptype,config.recipient);
                await node.ghgwallet.persistPresentation(payload);
                return payload;
            }
            try {
            if(Array.isArray(msg.payload)) {
                let payload = [];
                for(let i=0;i<msg.payload.length;i++) {
                    payload.push(await singleSend(msg.payload[i]));
                }
                msg.payload = payload;

            } else {
                msg.payload = await singleSend(msg.payload);
            }           
            node.status({fill:'green',shape:"dot",text:""});
            node.send(msg);
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to present ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("present",present);
}