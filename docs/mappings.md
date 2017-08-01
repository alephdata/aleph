### Mapping Files

One of Aleph’s primary task is bulk entity loading from structured datasets. Aleph has a YAML syntax to represent the database operations necessary to do this. The syntax is then translated into a Python `dict` under the hood.

Dataset paths are stored in a master YAML file, the location of which should be specified in `DATASETS_YAML`, in the format


```
datasets:
	include:
		- path/to.yml
```


Mappings are loaded with `aleph loaddataset <mapping name>`. The mapping's name is the top-level property of a mapping file. A mapping consists of information identifying the datasets, their sources, their types, and possible access information, and a list of database queries:


```
<mapping name>:
	label: <the dataset or sets being mapped>
	info_url: <source url, if available>
	category: <the type--company, land, etc.--of entities being loaded>
	roles:
		- <user roles>
		- ...
	queries:
		...
```


- MAPPING NAME: A string to identify this mapping. Is used with `aleph loaddataset` to load entities from a set of tables.
- LABEL: The name of the source.
- INFO_URL: The source url.
- CATEGORY: What kind of record the source provides (company, land, etc.)
- ROLES: User roles that are permitted to access this information. When no credentials are required, ‘guest’ suffices.
- QUERIES: The database operations that construct entities and links from DB records.

### Queries

A basic query specifies an entity to build out of the data in a given table. We can extend this operation by adding additional tables and filters, and by identifying links between different entities. Entities and links have schemas specified in `aleph/schema.yaml` (such as Entity, LegalEntity, Company, Directorship, etc.) that provide structure for the objects and relations that we're interested in loading.

A query has the following form:

```
- database: <database uri>
  tables:
	  - table: <table>
	  	alias: <table alias>
	  - ...
  (joins:)
	  - left: <table or alias>.<column>
	  	right: <table or alias>.<column>
	  - ...
  (filters/filters_not:)
  	  - <table>.<column>: <value>
	  - ...
  (where/where_not:)
      - <table>.<column> <SQL predicate> <value>
  entities:
	  <entity name>:
		  schema: <schema type>
		  keys:
			  - <table>.<column>
			  - ...
		  properties:
			  <property name>:
				  column: <table>.<column>
				  (literal:) <string>
			  ...
  (links:)
	  - schema: <schema type>
		source: <table>
		target: <table>
	 	properties:
		  	<property name>:
				column: <table>.<column>
				(literal:) <string>
	  - ...
```

Note that `-` is interpreted as an item in a list. Tables, keys, joins, and filters can all be referred to in the singular if only one item is needed (i.e. `table: <table name>`) without `-`.

- DATABASE: A database uri. Example: `postgresql://user:password@postgres/database`
- CSV_URL: Alternative to DATABASE. Supported protocols: http, https, file
- TABLES: A table or list of tables with (optional) aliases.
- JOINS: Join(s) to perform (note that under the hood, this is a WHERE a = b operation; may change in the future) (optional).
- FILTERS/FILTERS_NOT: Filter by column values (optional).
- WHERE/WHERE_NOT: Filter by SQL where statement (optional).
- ENTITIES:
	- SCHEMA: An entity schema as found in `aleph/schema.yaml`.
	- KEYS: Values to use for a unique identifier (sha1 digest of properties).
	- PROPERTIES: Entity properties, as specified by the chosen schema.
		- PROPERTY:
			- COLUMN: Specifies a column value to use.
			- LITERAL: Or you may provide a literal string value to use (optional).
- LINKS: (optional; schema, keys, and properties are defined as with entities)
	- SOURCE: The source of the link is its object--if we are linking a person to a company as its director, for instance, we refer to the company as the source.
	- TARGET: The entity that is the subject of the link. In the above example, the company's director would be the target of the link.

### Notes for making a good mapping (chill the join)

Mappings are *not* intended to perform expensive cleanup operations. Data should be reasonably structured and indexed where necessary. This also means keeping queries reasonable. In general, when linking, it's best practice to fully specify entities in their own queries, and then to join them using a skeleton representation. That means that rather than do this

```
- database: some://database/uri
  tables:
  	- first_table
	- second_table
  joins:
    - left: first_table
	  right: second_table
  entities:
	  first_entity:
		  schema: LegalEntity
		  keys:
			  - first_table.name
			  - first_table.address
			  - first_table.id_number
		  properties:
			  name:
				  column: first_table.name
			  address:
				  column: first_table.address
			  id_number:
				  column: first_table.id_number
	  second_entity:
		  schema: LegalEntity
		  keys:
			  - second_table.name
			  - second_table.address
			  - second_table.id_number
		  properties:
			  name:
				  column: second_table.name
			  address:
				  column: second_table.address
			  id_number:
				  column: second_table.id_number
  links:
	  - schema: link
	    source: first_entity
	    target: second_entity
```

we prefer

```

- database: some://database/uri
  tables:
     - first_table
  entities:
  	first_entity:
	  	schema: LegalEntity
		keys:
			- first_table.name
			- first_table.address
			- first_table.id_number
		properties:
			name:
				column: first_table.name
			address:
				column: first_table.address
			id_number:
				column: first_table.id_number

- database: some://database/uri
  tables:
  	- second_table
  entities:
	  second_entity:
		  schema: LegalEntity
		  keys:
			  - second_table.name
			  - second_table.address
			  - second_table.id_number
		  properties:
			  name:
				  column: second_table.name
			  address:
				  column: second_table.address
			  id_number:
				  column: second_table.id_number

- database: some://database/uri
  tables:
  	- first_table
	- second_table
  entities:
  	first_entity:
	  schema: LegalEntity
	  keys:
		  - first_table.name
		  - first_table.address
		  - first_table.id_number
	  properties:
		  name:
			  column: first_table.name	  
  	second_entity:
	  schema: LegalEntity
	  keys:
		  - second_table.name
		  - second_table.address
		  - second_table.id_number
	  properties:
		  name:
			  column: second_table.name
  links:
  	- schema: link
	  source: first_entity
	  target: second_entity

```

In order to avoid key collision, it's also best to specify several key columns containing identifying information (like name, address, and id_number above).
