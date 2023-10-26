## 3.15.3 (26-10-2023)
- Reduced docker image size
- Updated SECURITY.md
- New user guide
- Make it possible to manually trigger a docs deployment by @tillprochaska in #3226
- Added redirects for the old user guide
- Updates to the dev environment (note the postgres container version upgrade)
- Fix multiple token highlighting in search results
- Updated dependencies

## 3.15.1 (08-09-2023)
- Document how to enable IAM role-based auth between EC2 and S3
- Add a simple script to generate test emails
- Derive "safeHtml" from all "bodyHtml" values
- Fix user guide link
- Recommend ingest-file 3.19.2
- Updated dependencies

## 3.14.3 (28-06-2023)
- Introduced two new Settings which controll the scroll window of ElasticSearch queries made during xref operations:
    - ALEPH_XREF_SCROLL (defaults to 5m) is the 'scroll' parameter used on ES scan() calls for xref operations and configures how long a consistent view of the index should be maintained for scrolled search
    - ALEPH_XREF_SCROLL_SIZE (defaults to 1000) is the 'size' parameter used on ES scan() calls for xref operations
    and configures the size (per shard) of the batch sent for each iteration of a scan
- Updated translations
- Removed unneccessary packages from the UI Docker image

## 3.14.1 (11-05-2023)
- Support for error tracking via Sentry
- Fix a flaky UI test (#3011)
- Reference ghcr.io docker repository everywhere
- Configure bump2version to keep versions in contrib/ up-to-date
- Bump ingest-file to 3.18.4

## 3.14.0 (30-03-2023)

- Numerous library upgrades
- Updated Timelines feature. Timeslines are now more user friendly, better to look at and come with a new chart view that allow you to see your timelines on a line.

## 3.13.1-rc1 (09-11-2022)

- Library upgrades
- New version of ingest-file library
- New minor version of followthemoney
- FtM version is now displayed in the about us page
- fixed issue with some redirects not working correctly
- Updated the JSON log format

## 3.13.0 (21-11-2022)

- Library upgrades
- Minor fixes
- Updated Aleph to use Blueprint 4 (previous version was blueprint3)
- react-ftm has now been re-integrated with Aleph. The react-ftm library will now be deprecated
- Fixed the icon colour and alignment in network diagrams
- Fixed issue with scroll position resetting
- Fix investigation sidebar width
- Handle off-by-one bug in table viewer

## 3.12.7

- Library upgrades
- Minor fixes
- Updated to react-ftm v2.6.8, this release contains some small bugfixes and accessibility improvements
- improvements to highlighting in search results. We now display highlighted results within the raw text documents.
- Better handling of status messages without the need for Aleph re-deployment
- Updated contact details
- Updated custom settings in Aleph. There is now a mechanism for setting these via environment variables.

## 3.12.7-rc3 (2022-10-05)

- Reverted the updates to authlib which caused oauth functionality to fail in Aleph

## 3.12.7-rc2 (2022-10-04)

- Removed debugging code form some parts of the UI and improved linting to check for these things in the future
- Fixed an issue that was preventing Aleph from upgrading internally at OCCRP
- Added CHANGELOG notes

## 3.12.7-rc1 (2022-10-03)

- Numerous library upgrades
- Updated to react-ftm v2.6.8, this release contains some small bugfixes and accessibility improvements
- Fixed a small QoL issue where the button for hiding the left hand menu was hidden most of the time
- Made some changes to improve the highlighting in search results. Specifically we now display highlighted results within the raw text documents.
- Implemented a new way for handling status messages and displaying these to your users
- Updates details for contacting OCCRP
- Updated the way in which we approach custom settings in Aleph. There is now a mechanism for setting these via environment variables.

## 3.12.6 (2022-07-25)

- Develop QoL updates. Introduced prettier and eslint builds for github. Update code to meet new standards. Introduced the concept of RC versions for Aleph. Introduced Feature and Bugfix forms for easier issue creation. Bumped numerous libraries.

- Fixed bug where you could hit an infinite scroll if the API returned inconsistent results.

## 3.12.4 (2022-06-13)

- The histogram feature used for dates now allows you to zoom in and out to get a better view of the dates that are important to you. Note that histograms aren't yet great with vague dates (January 2021, 1984) so dates with no day or month will default to the first day of the month, year.
- Update pyjwt requirement from <2.4.0,>=2.0.1 to >=2.0.1,<2.5.0
- Bump react-ftm
- Bump followthemoney from 2.9.4 to 2.9.5
- Bump @formatjs/intl-relativetimeformat from 10.0.1 to 11.0.1
- Bump followthemoney from 2.9.3 to 2.9.4
- Bump @alephdata/followthemoney from 2.9.3 to 2.9.4 in /ui
- Bump alembic from 1.7.7 to 1.8.0 (#2296)
- Bump jsonschema from 4.5.1 to 4.6.0 (#2300)
- Bump sqlalchemy from 1.4.36 to 1.4.37 (#2297)

## 3.12.3 (2022-06-01)

- Fixed issue with Network diagrams where creating a Trip would cause the diagram to break
- Fixed an issue where we were not concatenating error messages for the same path
- Numerous library version bumps

## 3.12.2 (2022-03-28)

- The Aleph UI is now available in French.
- Fix search handler on Aleph homescreen
- Upgrade followthemoney to 2.8.5
- Upgrade followthemoney to 2.8.4 in UI
- Upgrade alembic to 1.7.7
- Upgrade urllib to 1.26.9
- Upgrade sqlalchemy to 1.4.32
- Upgrade normality to 2.3.1
- Upgrade servicelayer to 1.19.0
- Upgrade flask to 2.0.3

## 3.12.1 (2022-02-15)

- Fix bugs introduced in 3.12.0 ([#2115](https://github.com/alephdata/aleph/pull/2115), [#2112](https://github.com/alephdata/aleph/pull/2112))

## 3.12.0 (2022-02-02)

{% hint style="warning" %}
This release of Aleph introduced a couple of bugs that could make an Aleph instance unusable. Please skip this version in favour of newer Aleph versions.
{% endhint %}

- New followthemoney-compare ML model for xref [(#1818)](https://github.com/alephdata/aleph/pull/1818)
- UI tweaks for timelines. Timelines are no longer behind tester flag; now available to everyone.
- Users without write-access can see a read-only view of a dataset's source documents hierarchy
- Fix Google OAuth integration issue [(#2062)](https://github.com/alephdata/aleph/pull/2062)
- Upgrade to Elasticsearch 7.16.1 [(#2080)](https://github.com/alephdata/aleph/pull/2080)
- Dependency upgrades and bug fixes
- Upgrade ingest-file and convert-document to 3.16.1
  - Includes bug fix for PST mailbox processing [(ingest-file#197)](https://github.com/alephdata/ingest-file/pull/197)
  - Support for OCR in Khmer language [(ingest-file#194)](https://github.com/alephdata/ingest-file/pull/194)

## 3.11.1

- Dependency upgrades and bug fixes

## 3.11.0

- Allows users to configure custom facets for entity search screens - supports both type group facets (names, file types, addresses, etc.) as well as property facets.
- Allows users to configure the columns in the search results screen
- Adds NER support for Norwegian, Dutch and Danish languages
- Dependency upgrades and bug fixes

## 3.10.5

- Stability and UX improvement in processing of mentions in large PDF files
- Dependency upgrades
- Logging improvement in ingest-file for better debugging of configuration issues

## 3.10.4

- Dependency upgrades

## 3.10.2

- Build support for arm64 so that Aleph can run on the new M1 Macbooks
- New article viewer UI to show FtM Article entities
- Dependency upgrades

## 3.10.1

- **TESTING:** New timeline editor for investigations, allows users to create and browse events.
- Bug fixes and dependency upgrades.

## 3.10.0

- Fixed a bug in the tokenisation of the search index that dropped numbers from being made searchable. This has been fixed, but it only applies to collections (re-)indexed after this release.
- Improved scoring in cross-references based on a regression model derived from user judgements. Also tuned the way Aleph compares properties in the "Mentions" tab of documents etc.
- For Outlook email files (.msg), the RTF variant of the body will now be indexed in the form of an attachment to the message, titled `body.rtf`

## 3.9.10

- Inline the helm chart into the Aleph repository, it's now shipped with the main application. This requires updating your helm configuration if you've been using the previous charts.
- Loads of bug fixes for small UI issues.

## 3.9.9

- Re-design the Investigation UI for a UX that involves guiding the user through some common actions.
- Refactor much of the state handling in the React app.
- Bug fixes on ingestors.
- Allow entities in one collection to reference those in another.

## 3.9.8

- Re-name personal datasets to "Investigations" in the UI
- Introduce user interfaces for profiles, an interactive way to de-duplicate data. Fix various bugs in profile logic in the backend.
- Get rid of the global scoped search, show separate search bars closer to the subject of the search in the user interface.
- Introduce structured logging of JSON objects in Stackdriver.
- Polish data loading in the user interface and de-bug various features.

## 3.9.7

- Work on Arabic/RTL i18n, nested directionality.

## 3.9.6

- Debug OIDC logout
- Pairwise judgement API to replace xref decisions API.

## 3.9.5

{% hint style="warning" %}
In this version, the **OAuth configuration was changed in potentially breaking ways**. Please read the instructions below for how to adapt your deployment.
{% endhint %}

Aleph 3.9.5 uses [OpenID Connect](https://openid.net/connect/) to largely automate the configuration of delegated login. Previous versions of Aleph configured an OAuth2 client explicitly, which also required coding custom handlers for each OAuth provider. The new system also addresses a number of potential security issues.

Unfortunately, the transition requires some incompatible changes:

- You now need to configure a `ALEPH_OAUTH_METADATA_URL` to set an endpoint used by OIDC to self-configure.
  - Examples of valid metadata URLs for services like Google, Azure, Amazing Cognito and Keycloak can be found in the file `aleph.env.tmpl`.
  - The existing options `ALEPH_OAUTH_BASE_URL`, `ALEPH_OAUTH_TOKEN_URL` and `ALEPH_OAUTH_AUTHORIZE_URL` are no longer needed.
  - `ALEPH_OAUTH_HANDLER` and `ALEPH_OAUTH_SCOPE` are now optional.
- The database IDs generated for users and **groups will be different**. For users, the ID should be re-written the first time a user logs in after the upgrade. Groups, on the other hand, may require a SQL intervention to adapt their IDs. For example, with a Keycloak provider, the change would be:`UPDATE role SET foreign_id = REPLACE(foreign_id, 'kc:', 'group:') WHERE type = 'group';`

Beyond these breaking changes, some other differences are notable:

- Logging out of Aleph will now also log a user out of the OAuth provider, where supported (e.g. Keycloak, Azure).
- If a user is blocked or deleted while using the site, their session will be disabled by the worker backend within an hour. (This can be forced by running `aleph update`)

Changes unrelated to OAuth:

- EntitySets no longer contain an `entities` array of all their members. Use the sub-resource `/entitysets/x/entities` instead.
- Multiple bug fixes in UI related to i18n.

## 3.9.4

- Move file ingestor service `ingest-file` to its own repository to decouple versioning and CI/CD.

## 3.9.3

- Show transliterated names of non-latin entities in the user interface.
- Refactor query serialisation, remove in-database query log.
- Fix out of memory errors in cross-reference
- Extensive bug fixes in mapping UI

## 3.9.1

- Data exports feature to let users make offline data exports for searches and cross-reference
- New home page, based on the stupid CMS we introduced for the about section.
- Ability to map entities into lists via the UI and alephclient.
- Tons of bug fixes in UI and backend.

## 3.9.0

- UI for managing lists of entities within a dataset. This lets you make sub-sets of a dataset, e.g. "The Family", "Lawyers" or "Core companies".
- Ability to cross-reference a collection of documents against structured data collections using `Mention` schema stubs. Requires dataset reingest before it takes effect.
- New internationalisation mechanism for the React bits, using JSON-formatted translation files.

## 3.8.9

- Move the linkages API ("god entities" / record linkage) to use entity sets instead of its own database model.
- Remove soft-deletion for some model types (permissions, entities, alerts, mappings).

{% hint style="danger" %}
Aleph 3.8.9 combines all database migrations before Aleph 3.2 into a single version. If you want to upgrade from an Aleph older than 3.2, we recommend you move via 3.8.0, upgrade to that version, before migrating across this version.
{% endhint %}

## 3.8.6

- Date histogram facet and filtering tool on search results.
- Added example code for how to [add text processors](adding-text-processors.md) to Aleph.
- Re-worked collection stats caching to avoid super slow requests when no cache is present.
- Tons of bug fixes.

## 3.8.5

- Introduce EntitySets, as user-curated sets of ... entities! All diagrams are now entitysets, as will be timelines and bookmarks.

## 3.8.3

- Refactor queue and processing code for the Aleph worker.

## 3.8.1

- "Expand node" support in network diagrams pulls relevant connections from the backend and shows them to the user while browsing a network diagram.
- Correctly handle the use of multi-threading when using Google Cloud Storage Python client libraries.

## 3.8.0

- We've re-worked the way entities are aggregated before they are being loaded into the search index. This was required because Aleph is become more interactive and needs to handle non-bulk operations better. It also improves metadata handling, like which user uploaded a document, or when an entity was last updated. Aleph will now always keep a full record of the entities in the SQL database, whichever way they are submitted. To this end, we've migrated from `balkhash` to `followthemoney-store` (i.e. balkhash 2.0). This will start to apply to existing collections when they are re-ingested or re-indexed.
- Aleph has two new APIs for doing a collection `reingest` and `reindex`. The existing `process` collection API is gone. `alephclient` now supports running `reingest`, `reindex`, and `delete` on a collection.
- Operators can expedite the rollout of the new backend by running `aleph reingest-casefiles` and `aleph reindex-casefiles` to re-process all existing personal datasets.
- Numerous UI fixes make the table editor and network diagrams much more smooth.

## 3.7.2

- We've introduced a table editor in the user interface for manually editing entities in personal datasets.

## 3.7.0

- A graph expand API for entities returns all entities adjacent to an entity for network-based exploration of the data.

## 3.6.4

- **Linkages**, a new data model. A linkage is essentially an annotation on an entity saying it is the same as some other entities (in other datasets). This would, for example, let you group together all mentions of a politician into a single profile. Linkages are currently created via the Xref UI, which now has a ‘review mode’.
- In the future, profiles (ie. the composite of many linkages) will start showing up in the UI in different places, to introduce an increasingly stronger notion of data integration. Because linkages are based on a reporter’s judgement, they belong to either a) them, or b) a group of users — so they are always a bit contextualised, not fully public.
- Our hope is also that the data collected via linkages will provide training material for a machine learning-based approach to cross-referencing.

## 3.6.3

- Users who employ OAuth may need to change their settings to define a `ALEPH_OAUTH_HANDLER` in their `aleph.env` . By default, the following handlers are supported: `google`, `keycloak`, `azure`.

## 3.5.0

- Run VIS2 / [Network diagrams](../guide/building-out-your-investigation/network-diagrams.md) on Aleph as a testing feature.

## 3.4.9

- Two SECURITY ISSUES in the software: one that would let an attacker enumerate registered users, and the other could be exploited for XSS with a forged document. They were discovered by two friendly hackers from blbec.online who kindly reported them to us.

## 3.4.0

- The **mapping UI**. Prototyped by [@Felix Ebert](https://alephdata.slack.com/team/UE32DAC4S), [@Kirk](https://alephdata.slack.com/team/UL1AWH89X) and [@sunu](https://alephdata.slack.com/team/UE1EFLX5K) have done great work on this. The idea is that for a simple CSV file you can just upload it, and use the UI to map it into entities that you can cross-reference. It’s really simple to use and useful.
- `synonames`. This is an extension to our install of ElasticSearch that allows us to expand names into cultural transliterations. So for example doing a search for `Christoph` will now also search `Кристоф`, even though they aren’t literally the same names. This should increase recall for cross-cultural queries. The whole thing was a project from [@Aparna](https://alephdata.slack.com/team/UML9VA9K5), generating these aliases from Wikidata entries.
- These changes come alongside a lot of UI and backend polishing, so things should be much more smooth all around.

## 3.0.0

The goal of `aleph` 3.0.0 is to harmonise the handling of data inside the index. Instead of having different formats and mappings for documents, entities, table rows and document pages, there is now just one type of index object: an entity.

This means that document-based data is now completely 'translated' to the `followthemoney` ontology used by `aleph` (meaning that in theory, each page of a document and each row of a table is now a node in the object graph of the `aleph` platform).

### Upgrading

In order to accomplish this, a complete re-index is required in all cases. The recommended path of migrating from a 2.x.x installation is this set of commands in an aleph container shell (`make shell`):

```bash
# Re-create the indexes:
aleph resetindex
# Apply a database schema change:
aleph upgrade
# Re-index collections and documents:
aleph repair --entities
```

Be advised that any data loaded via the entity mapping mechanism will need to be re-loaded after this. It is also worth noting that at OCCRP, we have now started generating mapped data via the `followthemoney` command-line tool, and are using `alephclient` to bulk-load the resulting stream of entities into the system. This has proven to be significantly quicker than the built-in mapping process.

### Other changes

- Settings `ALEPH_REDIS_URL` and `ALEPH_REDIS_EXPIRE` are now `REDIS_URL` and

  `REDIS_EXPIRE`.

- Variable `ALEPH_OCR_VISION_API` is now `OCR_VISION_API`, it will enable use of

  the Google Vision API for optical character recognition.

- The `/api/2/collections/<id>/ingest` API now only accepts a single file, or

  no file (which will create a folder). The response body contains only the ID

  of the generated document. The status code on success is now 201, not 200.
