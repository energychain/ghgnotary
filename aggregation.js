module.exports = function(RED) {
    const lib = require("./lib.js");
    function ghgaggregation(config) {
        RED.nodes.createNode(this,config);
        
        this.ghgwallet = RED.nodes.getNode(config.wallet);
        var node = this;
        node.on('input', async function(msg) {
            node.status({fill:'yellow',shape:"dot",text:""});
            try {
                const app_wallet = await node.ghgwallet.getGhgWallet();
                let sc_aggregation = app_wallet.app.getAggregationContract(config.raggregation);
                msg.payload = {
                    emissions:await sc_aggregation.emissions() * 1,
                    savings:await sc_aggregation.savings() * 1,
                    nfts:await sc_aggregation.cntNFTs() *1,
                    compensation:await sc_aggregation.compensation() * 1,
                    owner:await sc_aggregation.owner()
                }
                node.send(msg);
                node.status({fill:'green',shape:"dot",text:""});
            } catch(e) {
                console.log(e);
                node.status({fill:'red',shape:"dot",text:"Failed to send ("+e+")"});
            }
        });
    }
    RED.nodes.registerType("Aggregation",ghgaggregation);
}