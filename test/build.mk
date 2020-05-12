
$(TEST_DIR): $(TEST_DIR)/public $(TEST_DIR)/build
	touch $@

$(TEST_DIR)/public: $(TEST_DIR)/build 
	$(eval FILES:=$(shell find $(TEST_DIR)/build -name \*.js))
	$(foreach f,$(FILES),\
	  $(BROWSERIFY) $(f) > $@/$(notdir $(basename $(f))).js)
	touch $@
