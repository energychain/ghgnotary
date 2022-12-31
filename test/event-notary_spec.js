var should = require("should");
var helper = require("node-red-node-test-helper");
var node = require("../event-notary.js");
var configNode = require("../wallet-config.js");
const fs = require("fs");

helper.init(require.resolve('node-red'));

describe('event-notary Node', function () {
  this.timeout(35000);

  beforeEach(function (done) {
      helper.startServer(done);
  });

  afterEach(function (done) {
      helper.unload();
      helper.stopServer(done);
  });

  it('should be loaded', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/event-notary_flow.json"));
    helper.load([node,configNode], flow, function () {
      var n1 = helper.getNode("64a1576d28a8cc89");
      try {
        n1.should.have.property('name', 'Event-Notary-Testing');
        done();
      } catch(err) {
        done(err);
      }
    });
  });
  it('should get certificate for event (Transaction)', function (done) {
    var flow = JSON.parse(fs.readFileSync("./examples/event-notary_flow.json"));
    helper.load([node,configNode], flow, function () {
      var n1 = helper.getNode("64a1576d28a8cc89");
      var helperNode = helper.getNode("testhelper");
      helperNode.on("input", function (msg) {
        try {
         // console.log(msg.payload);
          msg.payload.should.have.property('hash');
          msg.payload.should.have.property('owner');
          msg.payload.should.have.property('did');
          msg.payload.should.have.property('presentations');
          done();
        } catch(err) {
          done(err);
        }
      });
      n1.receive({ payload: Math.round(Math.random()*1000)+500 });
    });
  });
});