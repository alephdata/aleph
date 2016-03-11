Iteration II
============

* https://github.com/sayanee/angularjs-pdf/issues/96
* https://github.com/scrapinghub/extruct

* [DONE] Document / Record - distinction, raw data support
* [DONE] Use database to store documents and records
* [DONE] Inline S3/FS support
* [DONE] Ingest mechanism for URLs
* [DONE] Ingest mechanism for bundled files
* [DONE] Fix attributes facets
* [DONE] Spindle importer 
* [DONE] OpenNames importer
* [DONE] Fix entities facets
* [DONE] Upgrade bootstrap-ui
* [DONE] Refactor QueryContext 
* [DONE] Rename List -> Watchlist
* [DONE] Source facets
* [DONE] Source modals
* [DONE] Implicit facet on list_id
* [DONE] Simplify search UI
* [DONE] Bug fix watchlists
* [BASIC] Table viewer
* [DONE] OCCRP OAuth
* [DONE] Role/Permission
* [DONE] Source facet filters
* [DONE] Entity selection bug
* [DONE] Crawler permissions management
* [DONE] Database Crawler
* [WONTFIX] Watchlist edit controller
* [DONE] Image ingest / PDF generation
* [DONE] Fix image pdf generation
* [BASIC] Document pages viewer
* [DONE] Import ID ticket entities
* [DONE] Dates (on metadata and UI)
* [DONE] Switch to JSONB
* [DONE] Loading screen (spinner, failure)
* [DONE] Result drilldown
* [DONE] Tabular: Multiple sheets
* [DONE] Tabular: Highlight selected row
* [DONE] Tabular: Filter globally
* [DONE] crawldir CLI arguments
* [WONTFIX] Invert source selection options
* [DONE] Web crawler
* [DONE] JS set titles
* [DONE] Alerts / Subscriptions
* [DONE] BUG: content loaded in pagination does not have highlights
* [DONE] BUG: document search doesn't work
* [DONE] BUG: Selecting entity on home 
* [DONE] 3 Use cases on home page
* [DONE] Result list: too tiny, too crowded
* Watchlist subscriptins 
* [DONE] Fix OpenName import
* Fix SQL loader.
* Tabular: Cell value formatting
* Tabular: Fixed headers
* Tabular: Filter by field
* Tabular: Facet by field
* GDrive importer
* [MAYBE] Filter display
* Testing
* Check DOCX/XLSX ingest
* tidbits
* Refactor DocumentPage
* Refactor DocumentRecord (Tabular)


-------------

Alert
    - id
    - role_id
    - query
    - created_at
    - is_active

GET /api/1/alerts
POST /api/1/alerts 
DELETE /api/1/alerts/<id>


-------------

D.I.T.
======


* ElasticSearch indexer and query frontend

/etags
    name
    category
    aliases


/subscriptions
    > alert users about etags in ingestor input
    > 


/ingestors
    > harvest whole web sites
    > run a scraper
    > load raw data from some place



crawl.grano.cc/
    

    badguys
        /statements/
        /entities/
        /sets/

    archive
        /collections/ [list, edit, index]
        /query/
        /tag


"Osama bin Laden" ["Osama Bin Ladin", "Usama bin Laden"]





* Collections write API distinction
* Collections editor

* Lists + Entities model 
* Calais' "special" list and calais tagger
* Generic tagger 
* List editor and importer
