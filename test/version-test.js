var vows = require("vows"),
    assert = require("assert"),
    cubism = require("../");

var suite = vows.describe("cubism.version");

suite.addBatch({
  "semantic versioning": {
    topic: cubism.version,
    "has the form major.minor.patch": function(version) {
      assert.match(version, /^[0-9]+\.[0-9]+\.[0-9]+$/);
    }
  }
});

suite.export(module);
