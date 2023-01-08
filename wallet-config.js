module.exports = function(RED) {
    function WalletConfiguration(n) {
        RED.nodes.createNode(this,n);

        this.host = n.host;
        this.port = n.port;
        this.baseDir = '.';
        if(typeof RED.settings.userDir !== 'undefined') {
            this.baseDir = RED.settings.userDir;
        }

        const saveWallet = async function() {
            while(typeof node.wallet == 'undefined') {
                await new Promise(r => setTimeout(r, 50+ Math.round(Math.random()*200)));
            }
            while(typeof node.wallet.provider == 'undefined') {
                await new Promise(r => setTimeout(r, 50 + Math.round(Math.random()*200)));
            }
            return;
        } 
        node = this;

        this.getPrivateKey = function() {
            console.log("Unimplemented");
        };

        this.persistCertificate = function(certificate) {
            const fs = require("fs");
            
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/certificates/";
            if(!fs.existsSync(certificatestDir)) {
                fs.mkdirSync( certificatestDir,{recursive:true});
                fs.writeFileSync(certificatestDir+"index.json","[]");
            } 
            const indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
            indexJSON.push({
                certificate:certificate.did.payload.uid,
                time:new Date().getTime(),
                wh:certificate.presentations.consumption.payload.actual,
                emissions:certificate.presentations.ghg.payload.actual.grid,
                savings:certificate.presentations.ghg.payload.saving.grid
            })
            fs.writeFileSync(certificatestDir+""+certificate.did.payload.uid.toLowerCase()+".json",JSON.stringify(certificate));
            fs.writeFileSync(certificatestDir+"index.json",JSON.stringify(indexJSON));
        }

        this.persistPresentation = function(presentation) {
            const fs = require("fs");
            
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/presentations/";
            if(!fs.existsSync(certificatestDir)) {
                fs.mkdirSync( certificatestDir,{recursive:true});
                fs.writeFileSync(certificatestDir+"index.json","[]");
            } 
            const indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
            indexJSON.push({
                presentation:presentation.payload.payload.hash,
                time:new Date().getTime(),
                owner:presentation.owner,
                issuer:presentation.issuer,
                schema:presentation.payload["$schema"]
            })
            const typestr = presentation.payload["$schema"].substring( presentation.payload["$schema"].lastIndexOf("/")+1)
            fs.writeFileSync(certificatestDir+""+presentation.payload.payload.hash.toLowerCase()+"."+typestr+".json",JSON.stringify(presentation));
            fs.writeFileSync(certificatestDir+"index.json",JSON.stringify(indexJSON));
        }
        this.getCertificate = async function(hash) {
            hash = hash.toLowerCase();
            const fs = require("fs");
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/certificates/";
            let indexJSON = null;
            if(fs.existsSync(certificatestDir+"" + hash+".json")) {
                indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"" + hash+".json"));
            }
            return indexJSON;
        }

        this.getCertificatesList = async function() {
            const fs = require("fs");
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/certificates/";
            let indexJSON = [];
            if(fs.existsSync(certificatestDir+"index.json")) {
                indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
            }
            indexJSON.sort((a,b) => b.time - a.time);
            return indexJSON;
        }
        this.getPresentationsList = async function() {
            const fs = require("fs");
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/presentations/";
            try {
                const indexJSON = JSON.parse(fs.readFileSync(certificatestDir+"index.json"));
                indexJSON.sort((a,b) => b.time - a.time);
                return indexJSON;
            } catch(e) {
                return;
            }
        }      
        this.getCertificateById = async function(certificateId) {
            const fs = require("fs");
            const certificatestDir = node.baseDir+"/ghgwallets/"+n.id+"/certificates/";
            const certificate = JSON.parse(fs.readFileSync(certificatestDir+""+certificateId.toLowerCase()+".json"));
            return certificate;
        }
        this.getPresentation = async function(certificate,type,recipient) {
            certificate = await node.getCertificate(certificate);
            app_wallet.app.getPresentation(certificate,type,recipient);

        }
        this.ownedNFTs = async function(payload) {
            await saveWallet();

            const fs = require("fs");
            const latestId = (1 * await node.wallet.tydids.contracts.GHGCERTIFICATES._tokenIdCounter());
            let owners = [];
            nfts = [];
            // Lightning Cachde: We load from Disk what we already know.
            const walletDir = node.baseDir+"/ghgwallets/"+n.id+"/";
            if(fs.existsSync(walletDir+"nfts.json")) {
              
                nfts = JSON.parse(fs.readFileSync(walletDir+"nfts.json"));            
                for(let i=0;i<nfts.length;i++) {
                    if(nfts[i].tokenId>node.introTokenId) {
                        node.introTokenId = nfts[i].tokenId;
                    }
                    owners.push(nfts[i].hash);
                }
            }
            if(typeof payload.startTokenId !== 'undefined') {
                nfts = [];
                owners = [];
                node.introTokenId = payload.startTokenId;
            }
            for(let i=(1 * node.introTokenId) + 1;i<(1 * latestId);i++) {
                const owner = await node.wallet.tydids.contracts.GHGCERTIFICATES.ownerOf(i);
                if(owner.toLowerCase() == node.wallet.address.toLowerCase()) {
                    const did =  await node.wallet.tydids.contracts.GHGCERTIFICATES.tokenURI(i);
                    const hash = did.substring("did:ethr:6226:0x3bFCf4Fe3b7D2E2fd079b5Dd546Aa30300D8fBE1:".length);
                    owners.push(hash);
                    nfts.push({
                        tokenId:i,
                        hash:hash
                    });
                }
            }
            fs.writeFileSync(walletDir+"nfts.json",JSON.stringify(nfts));
            return owners;
        }

        this.getNFTEmission = async function(hash) {
            return 1 * (await node.wallet.tydids.contracts.GHGEMISSIONS.balanceOf(hash));
        }
        this.getNFTSaving = async function(hash) {
            return 1 * (await node.wallet.tydids.contracts.GHGSAVINGS.balanceOf(hash));
        }     
        // Method is called sync during init and provides after Init all operations as singleton
        this.getGhgWallet = async function() {
            // This is a dirty hack to avoid timing issues during startup
            while(node.context().global.get("wallet_"+n.id) == "loading") {               
                await new Promise(r => setTimeout(r, 50));
            }
            node.context().global.set("wallet_"+n.id,"loading");
            const fs = require("fs");
            const ghgwallet = await import('ghgwallet');    
            const walletDir = node.baseDir+"/ghgwallets/"+n.id+"/";
            
            if(!fs.existsSync(walletDir)) {
                fs.mkdirSync( walletDir,{recursive:true});    
            } 
            if(!fs.existsSync(walletDir+"wallet.json")) {
                const tmp_wallet = await ghgwallet.default();
                fs.writeFileSync(walletDir+"wallet.json",tmp_wallet.app.toString());
            }
            if(fs.existsSync(walletDir+"wallet.json")) {
                const persistance = JSON.parse(fs.readFileSync(walletDir+"wallet.json"));
                node.wallet = await ghgwallet.default(persistance.options);
                
                const initBlock = async function() {
                    let walletJSON =  JSON.parse(fs.readFileSync(walletDir+"wallet.json"));
                    await saveWallet();
                    let bln = await node.wallet.provider.getBlockNumber();
                    if(typeof walletJSON.introBlock == 'undefined') {
                        walletJSON.introBlock = bln;
                        walletJSON.introTokenId = 1 * (await node.wallet.tydids.contracts.GHGCERTIFICATES._tokenIdCounter());
                    } 
                    node.context().set("initBlock",bln);
                    walletJSON.initBlock = bln;
                    await saveWallet();
                    walletJSON.address = node.wallet.address;
                    fs.writeFileSync(walletDir+"wallet.json",JSON.stringify(walletJSON));
                    node.introBlock = bln;
                    node.introTokenId = walletJSON.introTokenId;
                }
                initBlock();

            }
            node.context().global.set("wallet_"+n.id,node.wallet.address);
            
            return node.wallet;
        }
        this.getGhgWallet();
    }
    RED.nodes.registerType("wallet-config",WalletConfiguration);
}