DEBUG?=no
UGLIFY?=./node_modules/.bin/uglifyjs
BROWSERIFY?=./node_modules/.bin/browserify
LESSC?=./node_modules/.bin/lessc
CLEANCSS?=./node_modules/.bin/cleancss
TSC?=./node_modules/.bin/tsc
WMLC?=./node_modules/.bin/wmlc
JS_VARS:=./node_modules/@quenk/wml-widgets/lib/classNames.js
COMPRESS:=$(if $(findstring yes,$(DEBUG)),,|$(UGLIFY))
COMPRESS:=

SRC_DIR:=src
BUILD_DIR:=build
TEST_DIR:=test

.DELETE_ON_ERROR:

./: $(BUILD_DIR) $(TEST_DIR)
	touch $@

$(BUILD_DIR): $(SRC_DIR)/app\
	      $(BUILD_DIR)/background\
	      $(BUILD_DIR)/content\
	      $(BUILD_DIR)/page\
              $(BUILD_DIR)/node
	touch $@

include $(SRC_DIR)/app/build.mk
include $(SRC_DIR)/background/build.mk
include $(SRC_DIR)/content/build.mk 
include $(SRC_DIR)/page/build.mk
include $(SRC_DIR)/node/build.mk
include $(TEST_DIR)/build.mk

# Run the extension in a temporary browser instance.
.PHONY: run
run:
	$(eval include .env)
	./node_modules/.bin/web-ext run --firefox=$(FIREFOX_BIN)
