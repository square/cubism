> [Wiki](Home) ▸ [API Reference](API-Reference) ▸ <b>Rule</b>

A thin vertical line that updates on mousemove. This is typically used to indicate the context's [focus value](Context#wiki-focus). To create a rule, first create a [context](Context). For example:

```js
var context = cubism.context(), // a default context
    rule = context.rule(); // a rule
```

<a name="_rule" href="#wiki-_rule">#</a> <b>rule</b>(<i>selection</i>)

Apply the rule to a [D3 selection](/mbostock/d3/wiki/Selections) or [transition](/mbostock/d3/wiki/Transitions) containing one or more SVG element. For example:

```js
d3.select("body").append("div")
    .attr("class", "rule")
    .call(rule);
```

<a name="metric" href="#wiki-metric">#</a> rule.<b>metric</b>([<i>metric</i>])

If *metric* is specified, sets this rule’s associated metric and returns the rule. If *metric* is not specified, returns the rule’s current metric which defaults to null. If a metric is associated with the rule, then a rule will be displayed at each non-zero value of the metric; otherwise, only a single rule will be displayed on mouseover at the mouse location. Binding a metric to a rule is a useful way to overlay events on a time-series, such as deploys.

<a name="remove" href="#wiki-remove">#</a> rule.<b>remove</b>(<i>selection</i>)

Removes the rule from a [D3 selection](/mbostock/d3/wiki/Selections), and removes any associated listeners. This method only removes the contents added by the rule itself; typically, you also want to call [remove](/mbostock/d3/wiki/Selections#wiki-remove) on the selection. For example:

```js
d3.select(".rule")
    .call(rule.remove)
    .remove();
```

Requires that the elements in the selection were previously bound to this rule.