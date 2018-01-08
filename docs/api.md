# Developer API v2.0

Aleph supports an extensive API for searching documents and entities. It
can also be used to retrieve raw metadata, source documents and other useful
details.

### General Overview

Aleph's API tries to follow a pragmatic approach based on the following
principles:

*   All API calls are prefixed with an API version; this version is `/api/2/`.
*   Responses and requests are both encoded as JSON. Requests should have the `Content-Type` and `Accept` headers set to `application/json`.
*   The application uses Representational State Transfer (REST) principles where convenient, but also has some procedural API calls.

#### Domain Model and REST Resources

Aleph exposes all significant aspects of it's domain model, which is explained in short below.

*   **Documents** (`/api/2/documents`) reflect a single text document or tabular document imported into Aleph. Every document is either imported as a text document with a number of text pages associated with it, or as a tabular document, which as a number of rows.
*   **Collections** (`/api/2/collections`) group documents and entities into sets, such as all the documents from a particular source, all the people relevant to a particular investigation, or all the companies on a country's sanctions list. They also control who can access information about an entity or document.
*   **Entities** (`/api/2/entities`) reflect structured data about persons or companies. Each entity has a name, a number of aliases and other details, such as their jurisdiction, a short summary, or contact and passport details. Entities are identified through a UUID.
*   **Roles** represent users and user groups, and they are connected via **Permissions** to sources and collections.

### Searching

The main search endpoint allows for a set of complex queries to be executed. Results will include documents _and_ entities, and their metadata, record snippets (for highlighting) and facet values that can be used to further summarize the result set.

<pre>GET /api/2/search</pre>

This accepts the following arguments:

*   `q`, a query string in ElasticSearch query syntax. Can include field searches, such as `title:penguin`.
*   `facet`, return facet values for the given metadata field, such as `languages`, `countries`, `mime_type` or `extension`. This can be specified multiple times for more than one facet to be added.
*   `filter:{field_name}`, filter the results by the given field. This is useful when used in conjunction with `facet` to create a drill-down mechanism. Useful fields are:
    *   `entities.id`, documents tagged with a particular entity.
    *   `collection_id`, documents belonging to a particular collection .
    *   `title`, of the document.
    *   `file_name`, of the source file.
    *   `source_url`, URL of the source file.
    *   `extension`, file extension of the source file.
    *   `languages`, in the document.
    *   `countries`, associated with the document.
    *   `keywords`, from the document.
    *   `emails`, email addresses mentioned in the document.
    *   `domains`, websites mentioned in the document.
    *   `phone_numbers,` mentioned in the document.
    *   `dates`, in any of the following formats: `yyyy-MM-dd`, `yyyy-MM`, `yyyy-MM-d`, `yyyy-M`, `yyyy`
    *   `mime_type`, of the source file.
    *   `author`, according to the source file's metadata.
    *   `summary`, of the document.
    *   `text`, entire text extracted from the document.
    *   `created_at`, when the document was added to aleph (`yyyy-mm -ddThh:ii:ss.uuuuuu`).
    *   `updated_at`, when the document was modified in aleph (`yyyy -mm-ddThh:ii:ss.uuuuuu`).
*   `limit`, the number of results to return, max. 10,000.
*   `offset`, the number of results to skip at the beginning of the result set.

By default, all queries will return a facet of the collections for which matching documents/entities have been found. A filter can be applied to show only results from a particular collection: `?filter:collection_id={collection_id}`.

If you know you only want to search documents (unstructured, ingested data) or entities (structured data which may have been extracted from a dataset, or entered by a human) you can use these arguments with the [/documents](#fetching-documents-and-metadata) or [/entities](#fetching-entities-and-metadata) endpoints.

#### Search Results as Excel

A second endpoint exists that accepts the same query parameters and will return an Excel 2007 (XML) file as it's result. The returned file contains a shortened representation of the results, but it is limited to 10,000 rows.

<pre>GET /api/2/search/export?q=pickles</pre>

### Reading and writing Collections

Collections can contain documents and/or entities. To get a (paged) list of all collections you have access to:

<pre>GET /api/2/collections</pre>

For the entities and documents in a particular collection:

<pre>GET /api/2/collections/{collection_id}</pre>

#### Updating collections

To update or delete a collection respectively, send a `POST` request with the new metadata to be added or a `DELETE` request to:

<pre>/api/2/collections/{collection_id}</pre>

To add new entities to a collection, you need to use the entities API. Deleting a collection also deletes all of the entities in the collection.

To create a new collection, `POST` the JSON metadata to:

<pre>/api/2/collections</pre>

#### Uploading documents to collections

To upload new documents to a collection, send a `POST` request with the files and metadata to:

<pre>/api/2/collections/{collection_id}/ingest</pre>

Metadata of a file is sent via a JSON-encoded POST variable, `meta`, which can contain nested values and lists for the following metadata fields:

* `parent`: A dictionary containing `foreign_id` or `id` of parent Document.
* `foreign_id`: Foreign id of the document
* `title`: Title of the document
* `summary`: Summary of the document
* `author`: Author of the document
* `crawler`: Name of the crawler used to fetch the document
* `source_url`: URL of source file
* `file_name`: Name of the document
* `mime_type`: MIME type of the document
* `headers`: Response headers while fetching the document
* `authored_at`: When the document was authored
* `modified_at`: Modification time of the document
* `published_at`: Publication time of the document
* `retrieved_at`: Retrieval time of the document
* `languages`: Languages in the document
* `countries`: Countries associated with the document
* `keywords`: Keywords for the document

To create a directory, send a `POST` request to the same endpoint with metadata but without any files.

#### Processing collection contents

To re-analyze and re-index all of the documents and entities in a collection:

<pre>POST /api/2/collections/{collection_id}/process</pre>

#### Cross-referencing

Cross-referencing lets you check if any of the entities in one collection appear in another collection. The results will only show from collections you are authorized to read. To see a summary list of all collections in the database containing matching entities:

<pre>GET /api/2/collections/{collection_id}/xref</pre>

To cross-reference one collection against a specific other one and see the list of matching entities:

<pre>GET /api/2/collections/{collection_id}/xref/{other_id}</pre>

If there are no results, it's possible the cross-referencer hasn't been run on these collections yet. To trigger it, send `POST` requests to either of the above two endpoints. You can retrieve the results with a new `GET` request; you may need to wait a few minutes.

To get both the summary and matches lists as an Excel file download:

<pre>GET /api/2/collections/{collection_id}/xref.xlsx</pre>

### Fetching Documents and Metadata

You can access all documents (subject to your access rights) with:

<pre>GET /api/2/documents/</pre>

And search/filter them using the same query arguments as [/search](#searching).

Once you've located a document, you may want to access it's metadata in full:

<pre>GET /api/2/documents/{document_id}</pre>

This will return the full set of fields stored for the given document. If you also want to access the original source data (e.g. a PDF document, CSV spreadsheet etc.), you can request it like this:

<pre>GET /api/2/documents/{document_id}/file</pre>

This may return an HTTP 302 redirect if the storage location for the document is a public URL.

#### PDF Representations

For all documents that are identified as text documents (including images, Word documents, E-Mails), Aleph generates a PDF representation that is used by the document viewer. This PDF form can be retrieved using the following API call:

<pre>GET /api/2/documents/{document_id}/pdf</pre>

This may return an HTTP 302 redirect if the storage location for the document is a public URL.

#### In-document Text Searches

For documents (text and tabular) the following API call will query the contained records (i.e. data rows or pages):

<pre>GET /api/2/search/records/{document_id}</pre>

This accepts the following arguments:

*   `q`, a query string in ElasticSearch query syntax. This can include field searches, such as `raw.my_column:penguin` to search the contents of a table which has the given column.
*   `limit`, the number of results to return, max. 10,000.
*   `offset`, the number of results to skip at the beginning of the result set.

#### Getting page contents

For text documents the recognized text of a particular page can be retrieved using the following API call:

<pre>GET /api/2/documents/{document_id}/pages/{page_no}</pre>

#### Tabular data API

Tabular documents are divided into several, numbered sheets which reflect the structure of an (Excel) worksheet. The first (and for most tables only) sheet will be 0\. Metadata about a particular sheet is available at the following endpoint:

<pre>GET /api/2/documents/{document_id}/tabular/{sheet_no}</pre>

Each sheet can also be queried using the following end point, which returns only the raw tabular data:

<pre>GET /api/2/documents/{document_id}/pages/{sheet_no}/rows</pre>

This is internally build as a search endpoint, and thus accepts the following arguments:

*   `q`, a query string in ElasticSearch query syntax.
*   `row`, the ID of a particular row, which should be presented as the first result.
*   `limit`, the number of results to return, max. 10,000.
*   `offset`, the number of results to skip at the beginning of the result set.

### Fetching Entities and Metadata

Similarly to the documents API, metadata about entities can be accessed provided you are authorized to read from the collection the entity is part of. You can access all entities (subject to your access rights) with:

<pre>GET /api/2/entities/</pre>

And search/filter them using the same query arguments as [/search](#searching).

<pre>GET /api/2/entities/{entity_id}</pre>

You can see the documents an entity appears in, including a relevance score:

<pre>GET /api/2/entities/{entity_id}/documents</pre>

To get an entity's links to other entities such as organisations or property, use:

<pre>GET /api/2/entities/{entity_id}/links</pre>

To see a list of similar entities in the store, including a relevance score, use:

<pre>GET /api/2/entities/{entity_id}/similar</pre>

#### Entities write API

To create a new entity, you can `POST` the metadata as JSON to the entities endpoint. It must include a `collection_id` for a collection to which you are authorized to write.

<pre>POST /api/2/entities</pre>

To update or delete an entity respectively, send a `POST` request with the new metadata to be added or a `DELETE` request to:

<pre>/api/2/entities/{entity_id}</pre>

The metadata of two entities can be merged into one. The resulting entity is added to the collection to which the first entity belonged, and the originals are deleted.

<pre>DELETE /api/2/entities/{entity_id}/merge/{other_id}</pre>

### Authorization and Access Control

By default, any Aleph search will return only public documents in responses to API requests. If you want to access documents which are not marked public, you will need to sign into the tool. This can be done using the OAuth login flow (i.e. by directing the user to `/api/2/sessions/login`), with a password-based login that returns a JSON Web Token (JWT), or through the use of an **API key**.

The API key for any account can be found by clicking on the "Profile" menu item in the navigation menu. It must be sent on all queries using the `Authorization` HTTP header:

<pre>Authorization: ApiKey 363af1e2b03b41c6b3adc604956e2f66</pre>

Similarly, a JWT can be sent in the Authorization header, after it has been returned by the login and/or OAuth processes.

Aleph does not use session cookies or any other type of stateful API.