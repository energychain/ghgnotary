
module.exports = function(RED) {
    const lib = require("./lib.js");
    function Presentations(config) {
        RED.nodes.createNode(this,config);
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            const app_wallet = await node.ghgwallet.getGhgWallet();
            const certs = await node.ghgwallet.getPresentationsList();
        

            msg.payload = certs
            node.send(msg);
        });
    }
    RED.nodes.registerType("presentations",Presentations);
}