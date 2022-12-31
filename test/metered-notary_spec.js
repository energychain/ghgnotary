var should = require("should");
var assert = require("assert");

var helper = require("node-red-node-test-helper");
var node = require("../metered-notary.js");
var configNode = require("../wallet-config.js");
const fs = require("fs");
const reading1 = Math.round(Math.random()*1000)+500 ;
const reading2 = reading1+(Math.round(Math.random()*1000)+500);
let nreading = 0;

helper.init(require.resolve('node-red'));

describe('metered-notary Node', function () {
  this.timeout(35000);

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function (done) {
      helper.unload();
      helper.stopServer(done);
  });

  it('should be loaded', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/metered-notary_flow.json"));
    helper.load([node,configNode], flow, function () {
      var n1 = helper.getNode("64a1576d28a8cc89");
      try {
        n1.should.have.property('name', 'Metered-Notary-Testing');
        done();
      } catch(err) {
        done(err);
      }
    });
  });
  it('should get certificate for first reading', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/metered-notary_flow.json"));
    helper.load([node,configNode], flow, function () {
      var n1 = helper.getNode("64a1576d28a8cc89");
      var helperNode = helper.getNode("testhelper");
      helperNode.on("input", function (msg) {
        try {
          msg.payload.should.have.property('hash');
          msg.payload.should.have.property('owner');
          msg.payload.should.have.property('did');
          msg.payload.should.have.property('presentations');
          assert.equal(msg.payload.metering.payload.counter,reading1);
          done();
        } catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: reading1});
    });
  });
  it('should get certificate for second reading', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/metered-notary_flow.json"));
    helper.load([node,configNode], flow, function () {
      var n1 = helper.getNode("64a1576d28a8cc89");
      var helperNode = helper.getNode("testhelper");
      helperNode.on("input", function (msg) {
        try {
          msg.payload.should.have.property('hash');
          msg.payload.should.have.property('owner');
          msg.payload.should.have.property('did');
          msg.payload.should.have.property('presentations');
          assert.equal(msg.payload.metering.payload.counter,reading2);
          done();
        } catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: reading2});
    });
  });
});