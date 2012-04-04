cubism.option = function(name, value) {
  var options = location.search.substring(1).split("&"),
      i = -1,
      n = options.length,
      o;
  while (++i < n) {
    if ((o = options[i].split("="))[0] == name) {
      return decodeURIComponent(o[1]);
    }
  }
  return value;
};
