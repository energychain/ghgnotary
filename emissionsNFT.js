module.exports = function(RED) {
    const lib = require("./lib.js");
    function emissionsNFT(config) {
     
        const isObject = function(payload) { if(Object.prototype.toString.call(payload).indexOf('Object') !== -1) return true; else return false; }
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            try {
                msg.payload = await node.ghgwallet.getNFTEmission(msg.payload);
                node.status({fill:'green',shape:"dot",text:""});
                node.send(msg);
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to check ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("Emissions",emissionsNFT);
}