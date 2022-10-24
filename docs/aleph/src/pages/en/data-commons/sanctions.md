---
description: >-
  OpenSanctions is a database of persons and companies of political, criminal, 
  or economic interest. We combine sanctioned entities, politically exposed 
  persons, and other public information.
---

# OpenSanctions

OpenSanctions is a global database of **persons and companies of political, criminal, or economic interest**. It combines the most important sanctions lists, databases of politically exposed persons, and other public information into a single, easy-to-access dataset.

The OpenSanctions dataset makes it easy for users to:

* Cross-check leaks and public databases for possible conflicts of interests and signs of illicit activity.
* Track political conflicts and compare world-wide sanctions policies.
* Check potential customers and partners in international dealings.

{% hint style="warning" %}
OpenSanctions is an effort provided by a non-profit at low resource levels. Use this data at your own risk, it is not our job to formally guarantee its completeness or freshness according to foreign business needs.
{% endhint %}

All scrapers included in OpenSanctions are [open source on GitHub](https://github.com/alephdata/opensanctions), and we're keen to receive pull requests with fixes or additional data sources. You are also invited to operate the scrapers on your own infrastructure, independently of OCCRP.

## Downloads

The datasets below are offered under the terms of a[ CC-BY 4.0 License](https://creativecommons.org/licenses/by/4.0/), which allows free re-use of the data. If you notice any mistakes or inaccuracies in the data, please let us know.

### Politically Exposed Persons

Datasets that contain details about politicians, members of cabinet or their families and associates.

####  **CIA World Leaders**

An index of most national-level cabinet members in world governments that is publicly maintained by the CIA.

| Publisher |  [US Central Intelligence Agency](https://www.cia.gov/) |
| :--- | :--- |
|  CSV | [Person.csv](https://storage.googleapis.com/occrp-data-exports/us_cia_world_leaders/csv/Person.csv) |
| JSON | [us\_cia\_world\_leaders.json](https://storage.googleapis.com/occrp-data-exports/us_cia_world_leaders/us_cia_world_leaders.json) |
| Source | [https://www.cia.gov/librar...](https://www.cia.gov/library/publications/resources/world-leaders-1/index.html) \(HTML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/us_cia_world_leaders.yml) |

####  **Every Politician**

An index of all national members of parliament in the world. This version only includes individuals active within the past 15 years.

| Publisher |  [MySociety \(UK Citizens Online Democracy\)](http://everypolitician.org) |
| :--- | :--- |
|  CSV | [Membership.csv](https://storage.googleapis.com/occrp-data-exports/everypolitician/csv/Membership.csv), [Organization.csv](https://storage.googleapis.com/occrp-data-exports/everypolitician/csv/Organization.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/everypolitician/csv/Person.csv) |
| JSON | [everypolitician.json](https://storage.googleapis.com/occrp-data-exports/everypolitician/everypolitician.json) |
| Source |  [https://github.com/everypolitician/ev...](https://github.com/everypolitician/everypolitician-data/raw/master/countries.json) \(JSON\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/everypolitician.yml) |

####  **EU Members of Parliament**

A set of all the members of the European Union parliament, which are elected by member state.

| Publisher |  [European Parliament](http://www.europarl.europa.eu/) |
| :--- | :--- |
|  CSV | [Membership.csv](https://storage.googleapis.com/occrp-data-exports/eu_meps/csv/Membership.csv), [Organization.csv,](https://storage.googleapis.com/occrp-data-exports/eu_meps/csv/Organization.csv) [Person.csv](https://storage.googleapis.com/occrp-data-exports/eu_meps/csv/Person.csv) |
| JSON | [eu\_meps.json](https://storage.googleapis.com/occrp-data-exports/eu_meps/eu_meps.json) |
| Source |  [http://www.europarl.europa.eu/meps/en...](http://www.europarl.europa.eu/meps/en/xml.html?query=full&filter=all) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/eu_meps.yml) |

####  **CoE Parliamentary Assembly**

The Council of Europe's parliamentary assembly is composed of members of national parliaments from European countries including Turkey and Russia.

| Publisher |  [Council of Europe](http://www.coe.int) |
| :--- | :--- |
| Source |  [http://www.assembly.coe.int/nw/xml/As...](http://www.assembly.coe.int/nw/xml/AssemblyList/MP-Alpha-EN.asp?initial=A) \(HTML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/coe_assembly.yml) |

### Crime

Persons wanted in connections with a crime.

####  **GB Insolvency Disqualified Directors**

Individuals which have been disqualified from holding the post of a company director in the United Kingdom following a court decision.

| Publisher |  [The UK Insolvency Service](https://www.insolvencydirect.bis.gov.uk) |
| :--- | :--- |
| Source |  [https://www.insolvencydirect.bis.gov....](https://www.insolvencydirect.bis.gov.uk/IESdatabase/viewdirectorsummary-new.asp) \(HTML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/gb_coh_disqualified.yml) |

####  **INTERPOL Red Notices**

International arrest warrants published by INTERPOL with a view to extradition of the wanted individuals.

| Publisher |  [Interpol](https://www.interpol.int/) |
| :--- | :--- |
| Source |  [https://www.interpol.int/INTERPOL-exp...](https://www.interpol.int/INTERPOL-expertise/Notices) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/interpol_red_notices.yml) |

### Sanctions Lists

Official lists of entities that have been sanctioned by countries or international organization.

####  **UN Consolidated Sanctions**

The Security Council's set of sanctions serve as the foundation for most national sanctions lists.

| Publisher |  [United Nations Security Council](https://www.un.org/en/sc/) |
| :--- | :--- |
|  CSV | [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/un_sc_sanctions/csv/LegalEntity.csv), [Passport.csv](https://storage.googleapis.com/occrp-data-exports/un_sc_sanctions/csv/Passport.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/un_sc_sanctions/csv/Person.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/un_sc_sanctions/csv/Sanction.csv) |
| JSON | [un\_sc\_sanctions.json](https://storage.googleapis.com/occrp-data-exports/un_sc_sanctions/un_sc_sanctions.json) |
| Source |  [https://scsanctions.un.org/resources/...](https://scsanctions.un.org/resources/xml/en/consolidated.xml) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/un_sc_sanctions.yml) |

####  **SDFM Blacklist**

Ukraine's financial intelligence unit publishes this list of sanctioned individuals.

| Publisher |  [Ukraine State Finance Monitoring Service](http://www.sdfm.gov.ua/) |
| :--- | :--- |
| Source |  [http://www.sdfm.gov.ua/content/file/S...](http://www.sdfm.gov.ua/content/file/Site_docs/Black_list/zBlackListFull.xml) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/ua_sdfm_blacklist.yml) |

####  **Swiss SECO Sanctions/Embargoes**

Switzerland manages a sanctions lists with a high degree of detail on the individuals that are subject to it's embargoes.

| Publisher |  [State Secretariat for Economic Affairs \(SECO\)](https://www.seco.admin.ch/) |
| :--- | :--- |
| CSV |  [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/ch_seco_sanctions/csv/LegalEntity.csv), [Passport.csv](https://storage.googleapis.com/occrp-data-exports/ch_seco_sanctions/csv/Passport.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/ch_seco_sanctions/csv/Person.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/ch_seco_sanctions/csv/Sanction.csv) |
| JSON | [ch\_seco\_sanctions.json](https://storage.googleapis.com/occrp-data-exports/ch_seco_sanctions/ch_seco_sanctions.json) |
| Source |  [https://www.sesam.search.admin.ch/ses...](https://www.sesam.search.admin.ch/sesam-search-web/pages/downloadXmlGesamtliste.xhtml?lang=en&action=downloadXmlGesamtlisteAction) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/ch_seco_sanctions.yml) |

####  **OFAC Consolidated List**

Both parts of the United States' consolidated sanctions list, both the specially designated nationals \(SDN\) and the non-SDN entities published by the Office of Foreign Assets Control \(OFAC\).

| Publisher |  [US Department of the Treasury](https://www.treasury.gov/) |
| :--- | :--- |
| CSV | [Company.csv](https://storage.googleapis.com/occrp-data-exports/us_ofac/csv/Company.csv), [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/us_ofac/csv/LegalEntity.csv), [Organization.csv](https://storage.googleapis.com/occrp-data-exports/us_ofac/csv/Organization.csv), [Ownership.csv](https://storage.googleapis.com/occrp-data-exports/us_ofac/csv/Ownership.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/us_ofac/csv/Person.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/us_ofac/csv/Sanction.csv), [Vessel.csv](https://storage.googleapis.com/occrp-data-exports/us_ofac/csv/Vessel.csv) |
| JSON | [us\_ofac.json](https://storage.googleapis.com/occrp-data-exports/us_ofac/us_ofac.json) |
| Source |  [https://www.treasury.gov/resource-cen...](https://www.treasury.gov/resource-center/sanctions/SDN-List/Pages/consolidated.aspx) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/us_ofac.yml) |

####  **US Denied Persons List**

The Bureau of Industry and Security publishes this list of entities which are relevant with regards to export controls.

| Publisher |  [US Department of Commerce](https://www.bis.doc.gov/) |
| :--- | :--- |
| CSV | [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/us_bis_denied/csv/LegalEntity.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/us_bis_denied/csv/Sanction.csv) |
| JSON | [us\_bis\_denied.json](https://storage.googleapis.com/occrp-data-exports/us_bis_denied/us_bis_denied.json) |
| Source |  [https://www.bis.doc.gov/dpl/dpl.txt](https://www.bis.doc.gov/dpl/dpl.txt) \(TXT\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/us_bis_denied.yml) |

####  **GB Consolidated List of Targets**

The United Kingdom's consolidated international sanctions list.

| Publisher |  [HM Treasury](https://www.gov.uk/) |
| :--- | :--- |
| CSV | [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/gb_hmt_sanctions/csv/LegalEntity.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/gb_hmt_sanctions/csv/Person.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/gb_hmt_sanctions/csv/Sanction.csv) |
| JSON | [gb\_hmt\_sanctions.json](https://storage.googleapis.com/occrp-data-exports/gb_hmt_sanctions/gb_hmt_sanctions.json) |
| Source |  [https://www.gov.uk/government/publica...](https://www.gov.uk/government/publications/financial-sanctions-consolidated-list-of-targets/consolidated-list-of-targets) \(HTML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/gb_hmt_sanctionslist.yml) |

####  **EEAS Consolidated List**

As part of the Common Foreign Security Policy the European Union publishes a sanctions list that is implemented by all member states.

| Publisher |  [European Union External Action Service](https://eeas.europa.eu/) |
| :--- | :--- |
| CSV | [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/eu_eeas_sanctions/csv/LegalEntity.csv), [Passport.csv](https://storage.googleapis.com/occrp-data-exports/eu_eeas_sanctions/csv/Passport.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/eu_eeas_sanctions/csv/Person.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/eu_eeas_sanctions/csv/Sanction.csv) |
| JSON | [eu\_eeas\_sanctions.json](https://storage.googleapis.com/occrp-data-exports/eu_eeas_sanctions/eu_eeas_sanctions.json) |
| Source |  [http://ec.europa.eu/external\_relation...](http://ec.europa.eu/external_relations/cfsp/sanctions/list/version4/global/global.xml) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/eu_eeas_sanctions.yml) |

####  **Kyrgyz FIU National List**

A list of sanctioned individuals and entities published by the Kyrgyzstan State Financial Intelligence Service.

| Publisher |  [State Financial Intelligence Service](https://fiu.gov.kg/) |
| :--- | :--- |
| Source |  [http://fiu.gov.kg/uploads/595c5fd1ea6...](http://fiu.gov.kg/uploads/595c5fd1ea663.xml) \(XML\) |
| Developer | [ Scraper code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/kg_fiu_national.yml) |

#### Australian DFAT Sanctions List

A list of all persons and entities who are subject to targeted financial sanctions or travel bans under Australian sanctions laws published by the Department of Foreign Affairs and Trades.

| Publisher | [Department of Foreign Affairs and Trades](https://dfat.gov.au/international-relations/security/sanctions/Pages/consolidated-list.aspx) |
| :--- | :--- |
| CSV | [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/au_dfat_sanctions/csv/LegalEntity.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/au_dfat_sanctions/csv/Person.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/au_dfat_sanctions/csv/Sanction.csv) |
| JSON | [au\_dfat\_sanctions.json](https://storage.googleapis.com/occrp-data-exports/au_dfat_sanctions/au_dfat_sanctions.json) |
| Source | [https://dfat.gov.au/international-relat...](https://dfat.gov.au/international-relations/security/sanctions/Documents/regulation8_consolidated.xls) \(XML\) |
| Developer | [Scraper Code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/au_dfat_sanctions.yml) |

#### Canada Special Economic Measures Act Sanctions

A list of persons and entities who are subject to sanctions by the Canada under Special Economic Measures Act

| Publisher | [Department of Foreign Affairs, Trade and Development](https://www.international.gc.ca/world-monde/international_relations-relations_internationales/sanctions/consolidated-consolide.aspx?lang=eng) |
| :--- | :--- |
| CSV | [LegalEntity.csv](https://storage.googleapis.com/occrp-data-exports/ca_dfatd_sema_sanctions/csv/LegalEntity.csv), [Person.csv](https://storage.googleapis.com/occrp-data-exports/ca_dfatd_sema_sanctions/csv/Person.csv), [Sanction.csv](https://storage.googleapis.com/occrp-data-exports/ca_dfatd_sema_sanctions/csv/Sanction.csv) |
| JSON | [ca\_dfatd\_sema\_sanctions.json](https://storage.googleapis.com/occrp-data-exports/ca_dfatd_sema_sanctions/ca_dfatd_sema_sanctions.json) |
| Source | [https://www.international.gc.ca/world-monde/ass...](https://www.international.gc.ca/world-monde/assets/office_docs/international_relations-relations_internationales/sanctions/sema-lmes.xml) \(XML\) |
| Developer | [Scraper Code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/ca_dfatd_sema_sanctions.yml) |

#### Worldbank List of Debarred Providers

Firms and individuals sanctioned under the Bank's fraud and corruption policy

| Publisher | [World Bank](https://www.worldbank.org/en/projects-operations/procurement/debarred-firms) |
| :--- | :--- |
| Source | [http://www.worldbank.org/en/projec...](http://www.worldbank.org/en/projects-operations/procurement/debarred-firms) \(HTML\) |
| Developer | [Scraper Code](https://github.com/alephdata/opensanctions/blob/master/opensanctions/config/worldbank_debarred.yml) |

## Frequently Asked Questions

### What is OpenSanctions?

OpenSanctions brings together sanctions lists, lists of politically exposed persons \(PEPs\), and parties excluded from government contracts in different countries. It is a list of persons and companies of political, criminal, or economic significance that merit further investigation.

It is meant to be a resource for journalists and civil society who need to perform due diligence-style tasks \(e.g. searching for persons of interest in a leak or open dataset\).

OpenSanctions is an open project, anyone is invited to use the dataset and contribute additional information.

### Where does the data come from?

Our preferred sources are official datasets published by governments all over the world; including commonly used sanctions and ban lists. In the future, we hope to also include information from media reporting, Wikidata and Wikipedia and litigation.

### How frequently is OpenSanctions updated?

The data is updated daily and processed in several stages, so there can be delays of up to 72 hours for a new entity to make its way into the master dataset.

### Does OpenSanctions only contain sanctions lists?

No, we are just bad at naming things. The project includes sanctions lists, lists of politicians, ban lists used in government procurement, lists of known terrorists and other data sources relevant to journalistic research and due diligence.

### Can I contribute a new data source?

Yes! We're particularly keen to add sources that include information from criminal cases, and family and associates of politically exposed persons.

Our data sources are currently on GitHub in the [OpenSanctions](https://github.com/alephdata/opensanctions) repository. Please file a ticket to suggest a new source and get access to contribute.

Data import scripts are Python scrapers written using the [Memorious scraping toolkit](https://docs.alephdata.org/developers/memorious-crawler). If you're keen to write or improve scrapers, we'd love your help!

Data is released under a[ CC-BY 4.0 License](https://creativecommons.org/licenses/by/4.0/), processing code is available under [MIT License](https://opensource.org/licenses/MIT) terms.

