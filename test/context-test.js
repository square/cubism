var vows = require("vows"),
    assert = require("assert"),
    cubism = require("../");

var suite = vows.describe("cubism.context");

suite.addBatch({
  "step": {
    "defaults to 10 seconds": function() {
      var c = cubism.context();
      assert.equal(c.step(), 1e4);
      c.cancel();
    },
    "gets the step duration": function() {
      var c = cubism.context();
      assert.equal(c.step(), 1e4);
      c.cancel();
    },
    "sets the step duration in milliseconds": function() {
      var c = cubism.context();
      assert.strictEqual(c.step(15e3), c);
      assert.equal(c.step(), 15e3);
      c.cancel();
    },
    "coerces the input value to a number": function() {
      var c = cubism.context().step("1000");
      assert.strictEqual(c.step(), 1e3);
      c.cancel();
    },
    "determines the stop time": function() {
      var c = cubism.context(),
          expected,
          actual;
      expected = new Date(Math.floor(Date.now() / 1e4) * 1e4);
      actual = c.stop();
      assert.instanceOf(actual, Date);
      assert.deepEqual(actual, expected);
      c.step(15e3);
      expected = new Date(Math.floor(Date.now() / 15e3) * 15e3);
      actual = c.stop();
      assert.deepEqual(actual, expected);
      c.cancel();
    },
    "determines the start time, in conjunction with size": function() {
      var c = cubism.context(),
          size = c.size(),
          expected,
          actual;
      expected = new Date(Math.floor(Date.now() / 1e4) * 1e4 - size * 1e4);
      actual = c.start();
      assert.instanceOf(actual, Date);
      assert.deepEqual(actual, expected);
      c.step(15e3);
      expected = new Date(Math.floor(Date.now() / 15e3) * 15e3 - size * 15e3);
      actual = c.start();
      assert.deepEqual(actual, expected);
      c.cancel();
    }
  },

  "size": {
    "defaults to 1440": function() {
      var c = cubism.context();
      assert.equal(c.size(), 1440);
      c.cancel();
    },
    "gets the count of steps": function() {
      var c = cubism.context();
      assert.equal(c.size(), 1440);
      c.cancel();
    },
    "sets the count of steps": function() {
      var c = cubism.context();
      assert.strictEqual(c.size(1920), c);
      assert.equal(c.size(), 1920);
      c.cancel();
    },
    "coerces the input value to a number": function() {
      var c = cubism.context().size("1000");
      assert.strictEqual(c.size(), 1e3);
      c.cancel();
    },
    "determines the start time, in conjunction with step": function() {
      var c = cubism.context(),
          expected,
          actual;
      expected = new Date(Math.floor(Date.now() / 1e4) * 1e4 - 1440 * 1e4);
      actual = c.start();
      assert.instanceOf(actual, Date);
      assert.deepEqual(actual, expected);
      c.size(1920);
      expected = new Date(Math.floor(Date.now() / 1e4) * 1e4 - 1920 * 1e4);
      actual = c.start();
      assert.deepEqual(actual, expected);
      c.cancel();
    }
  },

  "start": {
    "returns the start time": function() {
      var c = cubism.context(),
          expected,
          actual;
      expected = new Date(Math.floor(Date.now() / 1e4) * 1e4 - 1440 * 1e4);
      actual = c.start();
      assert.instanceOf(actual, Date);
      assert.deepEqual(actual, expected);
      c.cancel();
    }
  },

  "stop": {
    "returns the stop time": function() {
      var c = cubism.context(),
          expected,
          actual;
      expected = new Date(Math.floor(Date.now() / 1e4) * 1e4);
      actual = c.stop();
      assert.instanceOf(actual, Date);
      assert.deepEqual(actual, expected);
      c.cancel();
    }
  },

  "on(change)": {
    topic: function() {
      var callback = this.callback;
      cubism.context().step(1e3).on("change", function() { callback(null, this); });
    },
    "calls the callback at step intervals": function(context) {
      var actual = Date.now(),
          expected = Math.round(actual / 1e3) * 1e3;
      assert.lesser(Math.abs(actual - expected), 50);
      context.cancel();
    }
  },

  "cancel": {
    "cancels the context": function() {
      cubism.context().cancel(); // if this hangs, the test failed
    }
  }
});

suite.export(module);
