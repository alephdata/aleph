# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

all: peps sanctions icij samples

samples: \
	eu_subsidystories \
	eu_ted \
	md_companies

eu_subsidystories: eu_subsidystories.load

eu_ted: eu_ted.load

md_companies: md_companies.load

# This process is used to load a structured dataset using a mapping. The process
# will first generate partial FtM entities and store them in a temporary cache
# (balkhash) for aggregation. When loaded from the cache, all partial entities
# are combined into one JSON object and ready to be indexed.
#
# See also: https://docs.alephdata.org/developers/mappings
%.load:
	ftm store delete -d $* -o etl
	ftm map $*.yml | ftm store write -o etl -d $*
	ftm store iterate -d $* | aleph load-entities $*

# Load data from OpenSanctions.org, i.e. lists of politically exposed persons (PEPs) and
# sanctioned invididuals and entities.
#
# This data is already provided in Follow the Money format and can be loaded into the
# search index straight from a normal curl call.
#
# See also: https://docs.alephdata.org/data-commons/sanctions
peps: \
	everypolitician \
	eu_meps \
	us_cia_world_leaders

everypolitician: everypolitician.occrp-data-export

eu_meps: eu_meps.occrp-data-export

us_cia_world_leaders: us_cia_world_leaders.occrp-data-export

sanctions: \
	un_sc_sanctions \
	us_ofac \
	ch_seco_sanctions \
	ua_sdfm_blacklist \
	us_bis_denied \
	gb_hmt_sanctions \
	eu_eeas_sanctions \
	au_dfat_sanctions \
	ca_dfatd_sema_sanctions

un_sc_sanctions: un_sc_sanctions.occrp-data-export

us_ofac: us_ofac.occrp-data-export

ch_seco_sanctions: ch_seco_sanctions.occrp-data-export

ua_sdfm_blacklist: ua_sdfm_blacklist.occrp-data-export

us_bis_denied: us_bis_denied.occrp-data-export

gb_hmt_sanctions: gb_hmt_sanctions.occrp-data-export

eu_eeas_sanctions: eu_eeas_sanctions.occrp-data-export

au_dfat_sanctions: au_dfat_sanctions.occrp-data-export

ca_dfatd_sema_sanctions: ca_dfatd_sema_sanctions.occrp-data-export

%.occrp-data-export:
	curl -s https://storage.googleapis.com/occrp-data-exports/$*/$*.json | ftm validate | aleph load-entities $*
	aleph publish $*

icij: \
	icij_bahamas_leaks \
	icij_offshore_leaks \
	icij_panama_papers \
	icij_paradise_papers

icij_bahamas_leaks:
	curl -s https://public.data.occrp.org/datasets/icij/bahamas_leaks.ijson | ftm validate | aleph load-entities icij_bahamas_leaks
	aleph publish icij_bahamas_leaks

icij_offshore_leaks:
	curl -s https://public.data.occrp.org/datasets/icij/offshore_leaks.ijson | ftm validate | aleph load-entities icij_offshore_leaks
	aleph publish icij_offshore_leaks

icij_panama_papers:
	curl -s https://public.data.occrp.org/datasets/icij/panama_papers.ijson | ftm validate | aleph load-entities icij_panama_papers
	aleph publish icij_panama_papers

icij_paradise_papers:
	curl -s https://public.data.occrp.org/datasets/icij/paradise_papers.ijson | ftm validate | aleph load-entities icij_paradise_papers
	aleph publish icij_paradise_papers
