var should = require("should");
var helper = require("node-red-node-test-helper");
var signer = require("../signer.js");
var validator = require("../validator.js");
var configNode = require("../wallet-config.js");
const fs = require("fs");
var assert = require("assert");
let tmsg = {};

helper.init(require.resolve('node-red'));

describe('signer-validator Nodes', function () {
  this.timeout(35000);

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function (done) {
      helper.unload();
      helper.stopServer(done);
  });

  it('should be loaded signer', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/signer-validator_flow.json"));
    helper.load([signer,validator,configNode], flow, function () {
      var n1 = helper.getNode("64a1576d28a8cc89");
      try {
        n1.should.have.property('name', 'Signer-Testing');
        done();
      } catch(err) {
        done(err);
      }
    });
  });
  it('should be loaded validator', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/signer-validator_flow.json"));
    helper.load([signer,validator,configNode], flow, function () {
      var n1 = helper.getNode("65a1576d28a8cc89");
      try {
        n1.should.have.property('name', 'Valdidator-Testing');
        done();
      } catch(err) {
        done(err);
      }
    });
  });
  it('should be signed message (payload)', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/signer-validator_flow.json"));
    helper.load([signer,validator,configNode], flow, function () {
      var n1 = helper.getNode("64a1576d28a8cc89");
      var helperNode = helper.getNode("testhelper");
      helperNode.on("input", function (msg) {
        try {
          tmsg = msg;
          msg.payload.should.have.property('payload');
          msg.payload.should.have.property('iss');
          done();
        } catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: Math.round(Math.random()*1000)+500 });
    });
  });
  it('should validate message (payload)', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/signer-validator_flow.json"));
    helper.load([signer,validator,configNode], flow, function () {
      var n1 = helper.getNode("65a1576d28a8cc89");
      var helperNode = helper.getNode("testhelper");
      helperNode.on("input", function (msg) {
        try {
          tmsg = msg;
          msg.payload.should.have.property('payload');
          msg.payload.should.have.property('iss');
          done();
        } catch(err) {
          done(err);
        }
      });
      n1.receive(tmsg);
    });
  });
});