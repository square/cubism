var cubism_shift = {
  milliseconds: function(v) { v = +v; return function(d) { return new Date(+d + v); }; },
  second: function(v) { v *= 1e3; return function(d) { return new Date(+d + v); }; },
  minute: function(v) { v *= 6e4; return function(d) { return new Date(+d + v); }; },
  hour: function(v) { v = +v; return function(d) { d = new Date(+d); d.setHours(d.getHours() + v); return d; }; },
  day: function(v) { v = +v; return function(d) { d = new Date(+d); d.setDate(d.getDate() + v); return d; }; },
  month: function(v) { v = +v; return function(d) { d = new Date(+d); d.setMonths(d.getMonths() + v); return d; }; },
  year: function(v) { v = +v; return function(d) { d = new Date(+d); d.setFullYear(d.getFullYear() + v); return d; }; }
};
