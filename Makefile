JS_TESTER = ./node_modules/vows/bin/vows
JS_COMPILER = ./node_modules/uglify-js/bin/uglifyjs

.PHONY: test

all: cubism.v1.min.js package.json

cubism.v1.js: \
	src/cubism.js \
	src/id.js \
	src/identity.js \
	src/option.js \
	src/context.js \
	src/cube.js \
	src/graphite.js \
	src/metric.js \
	src/metric-constant.js \
	src/metric-operator.js \
	src/horizon.js \
	src/comparison.js \
	src/axis.js \
	src/rule.js \
	Makefile

%.min.js: %.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

%.js:
	@rm -f $@
	@echo '(function(exports){' > $@
	cat $(filter %.js,$^) >> $@
	@echo '})(this);' >> $@
	@chmod a-w $@

package.json: cubism.v1.js src/package.js
	@rm -f $@
	node src/package.js > $@
	@chmod a-w $@

clean:
	rm -f cubism.v1.js cubism.v1.min.js package.json

test: all
	@$(JS_TESTER)
