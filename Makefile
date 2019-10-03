DEBUG?=no
UGLIFY?=./node_modules/.bin/uglifyjs
BROWSERIFY?=./node_modules/.bin/browserify
LESSC?=./node_modules/.bin/lessc
CLEANCSS?=./node_modules/.bin/cleancss
TSC?=./node_modules/.bin/tsc
WMLC?=./node_modules/.bin/wmlc
JS_VARS:=./node_modules/@quenk/wml-widgets/lib/classNames.js

./: public test
	touch $@

public: public/testrun.js public/testrun.css
	touch $@

public/testrun.js: lib
	$(BROWSERIFY) lib/main.js \
	$(if $(findstring yes,$(DEBUG)),,|$(UGLIFY)) > $@

public/testrun.css: $(shell find src -type f -name \*.less)
	$(LESSC) $(if $(findstring yes,$(DEBUG)),--source-map-less-inline,)  \
	--js-vars=$(JS_VARS) src/main.less | $(CLEANCSS) > $@

lib: $(shell find src -type f -name \*.ts -o -name \*.wml)
	rm -R $@ || true 
	cp -R -u src $@
	$(WMLC) $@
	$(TSC) --project $@

test: test/public test/build
	touch $@

test/public: test/build test/base64/tests.js
	$(BROWSERIFY) test/base64/tests.js > $@/app.js
	touch $@

test/base64/tests.js: test/build
	echo "window.TESTRUN_SUITES = { " > $@
	$(eval FILES:=$(shell find test/build -name \*.js))
	$(foreach f,$(FILES),\
	  $(eval CODE=$(shell $(BROWSERIFY) $(f) | base64))\
	  @echo "'$(notdir $(basename $(f)))':'$(CODE)'" >> $@)
	echo "}" >> $@

test/build: $(shell find test/src -type f)
	rm -R $@ || true 
	cp -R -u test/src $@
	$(TSC) --project $@

.PHONY: docs
docs: lib
	./node_modules/.bin/typedoc \
	--mode modules \
	--out $@ \
	--tsconfig lib/tsconfig.json \
	--theme minimal lib  \
	--excludeNotExported \
	--excludePrivate && \
	echo "" > docs/.nojekyll
