# Developer API v2.0

Aleph supports an extensive API for searching documents and entities. It can also be used to retrieve raw metadata, source documents and other useful details.

### General Overview

Aleph's API tries to follow a pragmatic approach based on the following principles:

*   All API calls are prefixed with an API version; this version is `/api/2/`.
*   Responses and requests are both encoded as JSON. Requests should have the `Content-Type` and `Accept` headers set to `application/json`.
*   The application uses Representational State Transfer (REST) principles where convenient, but also has some procedural API calls.

#### Domain Model and REST Resources

Aleph exposes all significant aspects of it's domain model, which is explained in short below.

*   **Documents** (`/api/2/documents`) reflect a single text document or tabular document imported into Aleph. Every document is either imported as a text document with a number of text pages associated with it, or as a tabular document, which as a number of rows.
*   **Collections** (`/api/2/collections`) group documents and entities into sets, such as all the documents from a particular source, all the people relevant to a particular investigation, or all the companies on a country's sanctions list. They also control who can access information about an entity or document.
*   **Entities** (`/api/2/entities`) reflect structured data about persons or companies. Each entity has a name, a number of aliases and other details, such as their jurisdiction, a short summary, or contact and passport details. Entities are identified through a UUID.
*   **Roles** represent users and user groups, and they are connected via **Permissions** to sources and collections.

### Searching for Documents

The main search endpoint allows for a set of complex queries to be executed. Results will include document metadata, record snippets (for highlighting) and facet values that can be used to further summarize the result set.

<pre>GET /api/2/query</pre>

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
*   `collection`, like `facet` for entity collections: all entities which are tagged in result set documents and part of the given collection will be returned. This can be specified multiple times for more than one collection to be added.
*   `limit`, the number of results to return, max. 10,000.
*   `offset`, the number of results to skip at the beginning of the result set.

By default, all queries will return a facet of the document collections for which matching documents have been found. This cannot currently be disabled, but a filter can be applied to show only results from a particular collection: `?filter:collection_id={collection_id}`.

#### Search Results as Excel

A second endpoint exists that accepts the same query parameters and will return an Excel 2007 (XML) file as it's result. The returned file contains a shortened representation of the results, but it is limited to 10,000 rows.

<pre>GET /api/2/query/export?q=pickles</pre>

#### Search Results as a Co-occurrence Graph

Another way of interpreting search results is as edges in a graph of entities. In this representation, each document is treated as a link between any permutation of entities which that document has been tagged with. The returned graph can be used to understand the connectivity between those tagged entities. A result format can be specified using the `format` parameter, either as `gexf` (Graph Exchange Format XML) or `d3`, a JSON format suitable for use in D3.js-based force-directed graphs.

<pre>GET /api/2/query/graph?q=pickles&format=gexf</pre>

Note that this query type is only useful if entities are loaded into the Aleph instance and at least one collection is specified as a search facet.

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

<pre>GET /api/2/query/records/{document_id}</pre>

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

Similarly to the documents API, metadata about entities can be accessed provided you are authorized to read from the collection the entity is part of.

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

By default, any Aleph search will return only public documents in responses to API requests. If you want to access documents which are not marked public, you will need to sign into the tool. This can be done either using the OAuth login flow (i.e. by directing the user to `/api/2/sessions/login`, and then making all further requests using the resulting session cookie), or through the use of an **API key**.

The API key for any account can be found by clicking on the "Profile" menu item in the navigation menu. It must be sent on all queries using the `Authorization` HTTP header:

<pre>Authorization: ApiKey 363af1e2b03b41c6b3adc604956e2f66</pre>

The authorization status of a user can be checked at any time by calling the `/api/2/sessions` endpoint, which also includes the user profile and details regarding their access rights.