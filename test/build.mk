TEST_PUBLIC_DIR:=$(TEST_DIR)/public
TEST_BUILD_DIR:=$(TEST_DIR)/build
TEST_SRC_DIR:=$(TEST_DIR)/src

$(TEST_DIR): $(TEST_PUBLIC_DIR) $(TEST_BUILD_DIR)
	touch $@

$(TEST_DIR)/public: $(TEST_BUILD_DIR)
	$(eval FILES:=$(shell find $(TEST_DIR)/build -name \*.js))
	$(foreach f,$(FILES),\
	  $(BROWSERIFY) $(f) > $@/$(notdir $(basename $(f))).js)
	touch $@

$(TEST_BUILD_DIR): $(shell find $(TEST_SRC_DIR) -type f)
	rm -R $@ || true 
	cp -R -u test/src $@
	$(TSC) --project $@
