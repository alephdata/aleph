# Using the OpenAleph Command-Line Interface

The OpenAleph command-line interface (CLI) allows you to interact with an OpenAleph instance from your terminal. It supports tasks such as crawling documents, loading spreadsheets, and managing collections.

## Basic Usage

All CLI commands share the following global options:

```bash
openaleph --host <URL> --api-key <KEY> [--retries N] <command> [options]
```

You can also set these values as environment variables:

```bash
export OPAL_HOST=https://your-aleph-instance.org
export OPAL_API_KEY=your_api_key_here
```

These allow you to run commands without specifying `--host` and `--api-key` each time.

## The Commands
### `crawldir`

Recursively upload the contents of a folder to a collection, with optional pause/resume:

```bash
openaleph crawldir -f <foreign-id> [--resume] [--parallel N] [--noindex] [-l LANG] <path>
```

- `-f, --foreign-id`    Foreign-ID of the target collection (required)
- `--resume`            Resume from an existing state database; omit to start fresh (this will delete the state file!)
- `-p, --parallel N`    Number of parallel upload threads (default: 1)
- `-i, --noindex`       Skip indexing on ingest
- `-l, --language LANG` Language hints ([ISO 639 code](https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes), repeatable)

#### State Persistence

When running **crawldir**, OpenAleph maintains a small SQLite database file in your crawl root:

```
<crawl-root>/.openaleph_crawl_state.db
```

- **Purpose**: track which files have already been successfully uploaded.
- **Resume support**:
  - Passing `--resume` skips any files recorded in this DB.
  - Omitting `--resume` deletes any existing state DB and starts fresh.
- **Thread-safe**: uploads are recorded under a lock to support parallel threads.
- **Update datasets later**: The db file stays in the directory, allowing you to update your local repository at any time and only sync the new files to OpenAleph.

#### Ignore File

You can create a file named:

```
<crawl-root>/.openalephignore
```

and list glob patterns for any files or directories you want to skip entirely:

```text
# Skip hidden files
.*

# Common junk
.DS_Store
Thumbs.db

# Temporary directories
tmp/
build/

# Log files
*.log
```

- Patterns are matched against the **relative path** of each file or folder.
- A pattern ending in `/` only matches directories (and their contents).
- Blank lines and lines beginning with `#` are ignored.
- Anything matched here is never enqueued or uploaded.
- the `.openalephignore` file itself is ignored by default, and so is the state file

#### Final Report

After a crawl completes, OpenAleph will print a summary to the console. If any failures occurred, by default a file is written to:

`<crawl-root>/.openaleph-failed.txt`

It contains one relative path per line for each file that could not be uploaded permanently. You can inspect this file to retry or investigate failures.

### `fetchdir`

Download all entities in a collection (or a single entity) into a folder tree:

```bash
openaleph fetchdir -f <foreign-id> [-e <entity-id>] [-p <path>] [--overwrite]
```

### Other commands

- `reingest`         Re-ingest all documents in a collection
- `reindex`          Re-index all entities in a collection
- `delete`           Delete a collection and its contents
- `flush`            Delete all contents of a collection
- `write-entity`     Index a single entity from stdin
- `write-entities`   Bulk-index entities from stdin
- `stream-entities`  Stream entities to stdout
- `entitysets`       List entity sets
- `entitysetitems`   List items in an entity set
- `make-list`        Create a new list entity set

## Piping data in and out

As with most command line tool, `openaleph` is most powerful when combined with other applications. This is specifically true when used with the [FollowtheMoney cli tool](https://followthemoney.tech/docs/cli/). Here are some examples:

```bash
openaleph stream-entities -f FOREIGN_ID -s Company | ftm export-excel -o entities.xlsx
```
Pipe all entities with the `Company` schema into `ftm` and save them into a spreadsheet.
---
```bash
openaleph stream-entities -f FOREIGN_ID | jq -c 'select(any(.properties.jurisdiction[]?; . == "ru") or any(.properties.country[]?; . == "ru") or any(.properties.nationality[]?; . == "ru"))' > filtered_enties.ftm.json
```
Run all entities from a dataset through [`jq`](https://jqlang.org/) and filter out all the Russian ones.
---
```bash
curl -o us_ofac.json hhttps://data.opensanctions.org/datasets/latest/us_sanctions/entities.ftm.json
cat us_ofac.json | ftm store write -d us_ofac
ftm store iterate -d us_ofac | alephclient write-entities -f us_ofac
ftm store delete -d us_ofac
```
Downloading, aggregating, ingesting and cleaning up locally - all in a few lines of bash.
---

This CLI is ideal for users who want to automate ingestion tasks, integrate structured data pipelines, or manage OpenAleph programmatically. If you plan to parse work with entities in Python scripts and ingest them into OpenAleph, for example from a scraper, [read this section](python.md).
