MAPPINGS_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))

all: \
	load.ch_seco_sanctions \
	load.coe_assembly \
	load.eu_eeas_sanctions \
	load.eu_meps \
	load.gb_coh_disqualified \
	load.interpol_red_notices \
	load.kg_fiu_national \
	load.ua_sdfm_blacklist \
	load.un_sc_sanctions \
	load.us_bis_denied \
	load.us_cia_worldleaders \
	load.us_ofac

load.%: flush.%
	aleph bulkload $(MAPPINGS_DIR)/$*.yml

flush.%:
	aleph flush $* || echo "first load"


