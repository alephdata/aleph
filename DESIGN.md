
## Use cases

* As a journalist, I want to combine different types of facets which
  represent document and entity metadata.
* As a journalist, I want to see a list of documents that mention
  a person/org/topic so that I can sift through the documents.
* As a journalist, I want to intersect sets of documents that mention multiple
  people/orgs/topics so that I can drill down on the relationships between them. 
* As a data importer, I want to routinely crawl and import documents
  from many data sources, including web scrapers, structured sources and filesystems. 
* As a data importer, I want to associate metadata with documents
  and entities so that users can browse by various facets. 


## Basic ideas

* Each imported document is either tabular or textual. It has many records, i.e. data rows
  or document pages.
* An entity (such as a person, organisation, or topic) is like a permanent search query;
  each entity can have multiple actual search terms associated with it (``selectors``).
* Documents matching an entity after that entity has been created yield notifications if
  a user is subscribed.



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
* [DONE] Testing
* [DONE] Check DOCX/XLSX ingest
* tidbits
* [DONE] Refactor DocumentPage
* [DONE] Refactor DocumentRecord (Tabular)



* [DONE] entityIcon directive
* [DONE] double check index
* [DONE] double check tagger
* [DONE] update entities
* do content-based object merge
* [DONE] do schema model deletion
* [DONE] switch entity PK to UUIDs

* [DONE] index entities
* [DONE] adapt spindle importer
* [DONE] adapt opennames importer
* [DONE] adapt id importer
* [DONE] ui directives for collection management 
* ui directives for entity edit
* ui directives for entity bulk add
* [DONE] ui collection index

* [DONE] Alerts refactor model
* [DONE] Delete metadata cache after collection creation
* [DONE] Check entity tagger
* [DONE] Simplify entity creation 
* Entity edit screen

De-dupe todo: 

1. merge identifiers
2. merge properties
3. merge names, make merged names into a.k.a's
4. merge collections
5. update references 
6. update alerts
7. delete source entities
8. update source entities
9. update target entity


mini-bugs: 

* Country selector
* Watchlist sorting
* Watchlist edit when entity save

* [DONE] Watchlist creator directive
* Alerts code
* [DONE] Fix up dates
* ICTY crawler
* Web crawler
* Facet label truncation 
* [DONE] Entities on document pages
* Analyzers API
* Email, URL, IP, CC, analyzer


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
