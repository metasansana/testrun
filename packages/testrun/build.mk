TESTRUN_SRC_DIR:=$(TESTRUN_DIR)/src
TESTRUN_BUILD_DIR:=$(TESTRUN_DIR)/lib

$(TESTRUN_DIR): $(TESTRUN_BUILD_DIR)
	touch $@

$(TESTRUN_BUILD_DIR): $(shell find $(TESTRUN_SRC_DIR) -type f -name \*.ts )
	@rm -R $@ || true 
	cp -R -u $(TESTRUN_SRC_DIR) $@
	$(TSC) --project $@
