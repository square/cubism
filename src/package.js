var util = require("util"),
    cubism = require("../cubism").cubism;

util.puts(JSON.stringify({
  "name": "cubism",
  "version": cubism.version,
  "private": true,
  "main": "./index.js",
  "repository": {
    "type": "git",
    "url": "http://github.com/square/cubism.git"
  },
  "dependencies": {
    "d3": "2.8.1"
  },
  "devDependencies": {
    "vows": "0.6.1",
    "uglify-js": "1.2.5"
  }
}
, null, 2));
