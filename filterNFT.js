module.exports = function(RED) {
    const lib = require("./lib.js");
    function filterNFT(config) {
     
        const isObject = function(payload) { if(Object.prototype.toString.call(payload).indexOf('Object') !== -1) return true; else return false; }
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            try {
                let msg0 = null;
                let msg1 = null; 

                const cert = await node.ghgwallet.getCertificate(msg.payload);
                if(cert == null) {
                    node.status({fill:'red',shape:"dot",text:msg.payload});
                    msg1 = msg;
                } else {
                    node.status({fill:'green',shape:"dot",text:msg.payload});
                    msg0 = msg;
                }                
                node.send([msg0,msg1]);
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to check ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("Filter NFT",filterNFT);
}