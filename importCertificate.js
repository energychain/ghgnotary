module.exports = function(RED) {
    const lib = require("./lib.js");
    function importCertificate(config) {
     
        const isObject = function(payload) { if(Object.prototype.toString.call(payload).indexOf('Object') !== -1) return true; else return false; }
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            try {
                const app_wallet = await node.ghgwallet.getGhgWallet();
                const r = await node.ghgwallet.persistCertificate(msg.payload);
                node.status({fill:'green',shape:"dot",text:""});
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to send ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("Import CERT",importCertificate);
}