---
description: >-
  Instructions for projecting structured data into Aleph's knowledge graph using
  a data mapping.
---

# Importing structured data

Aleph is commonly used to import data tables \(like a companies registry, list of persons of interest, or a set of government contracts\) that a user wants to search and browse. 

It does this by mapping tabular source data to the [Follow the Money](https://docs.alephdata.org/developers/followthemoney) \(FtM\) data model.  Aleph defines entities \(such as `People`, `Companies`, `Assets` or `Court Cases`\), and the relationships between them \(such as `Family`relations, or business interests – `Ownership` or `Directorship`, or other links like `Sanctions`, `Payments` \).

To load structured data into Aleph, an entity mapping file needs to be created. A mapping file uses YAML syntax to describe how information from a table can be projected to FtM entities.

{% hint style="info" %}
Mappings can only be applied to tabular data. Other file types, such as PDFs, E-Mails or PowerPoints are converted into Follow the Money entities using an automated process \(`ingest-file`\) that extracts only limited semantics.
{% endhint %}

## **Getting started**

In order to map data to a Follow the Money model, you will need the following: a source data table, a tool to process the mapping, and a mapping file \(to direct the tool\). 

**Source data** can be either a CSV \(comma-separated values\) file using the UTF-8 character encoding, or a valid [connection string](https://docs.sqlalchemy.org/en/13/core/engines.html#database-urls) to connect to a SQL database. Using SQL as a source also lets you perform JOINs within the database while mapping data.

In order to **execute a mapping**, you need either [a running instance of the Aleph server](installation.md), or you need to install the [ftm command-line](followthemoney/ftm.md) utility. Using the command-line tool is recommended for playing around with a mapping while you are refining it. When using the server to map data, you must make sure that the source data is located at a place that is accessible to the Aleph `worker`, such as an HTTP URL for a CSV file or a database that Aleph can connect with.

To write a **mapping file**, you will first need to identify:

* the types of entities included in the dataset \(e.g. `People`, `Companies`, `Directorships`\)
* the properties that describe each entity \(e.g. the `name` of a `Company`, or the `birthDate` of a `Person`\)
* and the the field or combination of fields that can be used to generate a `key`   \(this used to uniquely identify each entity in the dataset\). Find more details on these requirements [below](mappings.md#generating-unique-keys). 

## **A simple mapping example**

Writing a mapping file is often an iterative process, which we can gradually expand upon to refine the data model. 

Below is a simple mapping file. It downloads a list of British members of parliament and transforms them into FtM `Person` entities. 

{% code title="brexitonians.yml" %}
```yaml
gb_parliament_57:
  queries:
  - csv_url: http://bit.ly/uk-mps-csv
    entities:
      member:
        schema: Person
        keys:
        - id
        properties:
          name:
            column: name  
```
{% endcode %}

The mapping file specifies a dataset name \(`gb_parliament_57`\) and uses a single query to pull data from a CSV file \(the dataset is from the excellent EveryPolitician project\). The query generates a `Person` entity, which maps the CSV's `id` column to a key, and the CSV's `name`column to the FtM property `name`

{% hint style="info" %}
Try saving this file to your computer and executing it with the [ftm command-line tool](followthemoney/ftm.md): `ftm map brexitonians.yml`.
{% endhint %}

Aleph will now have a dataset called `gb_parliament_57` , which is a list of MP names. To use FtM language – the data has been mapped to a  `Person` entity with a single property \( `name`\).

### Assigning additional properties

However, the source CSV file has far more detail on each MP,  from e-mail addresses to political party affiliation. To include this data in  `gb_parliament_57` , we need to map each CSV column to the respective property as defined in the FtM schema. ****The properties vary based on the type of entity \(a `Person` will have different properties from a `Company`\). 

To find out what properties exist for a particular schema, you can [check out the YAML-based schema definitions](https://github.com/alephdata/followthemoney/tree/master/followthemoney/schema) on GitHub or [the diagrams here](followthemoney/).  \(As seen in the diagram,  FtM schemata have a hierarchical structure. Entities can be assigned all the properties of their parent entities. For instance, `Person` is a child of  `LegalEntity`, which is a child of `Thing` . As such, a  `Person` can be assigned all of the properties of a `LegalEntity` and `Thing`.\)

Here's an updated mapping file, which maps additional columns from the CSV file to properties in the `Person` schemata \(`email`, `nationality`, and `alias`\). 

{% code title="brexitoids.yml" %}
```yaml
gb_parliament_57:
  queries:
  - csv_url: http://bit.ly/uk-mps-csv
    entities:
      member:
        schema: Person
        keys:
        - id
        properties:
          name:
            column: name
          alias:
            column: sort_name
          email:
            column: email
          nationality:
            literal: GB
```
{% endcode %}

### Generating multiple entities

Now that we've generated a detailed record for each MP, we might want to add their party membership. First, let's map a party entity \(Line 12 onwards\):

{% code title="brexicles.yml" %}
```yaml
gb_parliament_57:
  queries:
  - csv_url: http://bit.ly/uk-mps-csv
    entities:
      member:
        schema: Person
        keys:
        - id
        properties:
          name:
            column: name
      party:
        schema: Organization
        keys:
        - group_id
        properties:
          name:
            column: group
```
{% endcode %}

When run this will create twice as many entities as before: the MPs, and parties. Note how each party is generated multiple times \(once for each of its members\). When you're using the command-line, you will need to perform [entity aggregation](followthemoney/ftm.md#aggregating-entities-using-balkhash) to merge these duplicates. Running the mapping inside of the Aleph server will do this automatically.

### Creating relationships between entities

What this does not yet do, however, is explicitly create a link between each MP and their party. In Follow the Money parlance, links \(or relationships\) are just another entity type. Note how, on lines 5 and 12 in the above mapping, we are assigning a temporary name for the `member` and the `party`. We can use these references when generating a third entity, the `Membership`:

{% code title="brexosaurs.yml" %}
```yaml
gb_parliament_57:
  queries:
  - csv_url: http://bit.ly/uk-mps-csv
    entities:
      member:
        schema: Person
        keys:
        - id
        properties:
          name:
            column: name
      party:
        schema: Organization
        keys:
        - group_id
        properties:
          name:
            column: group
      membership:
        schema: Membership
        keys:
        - id
        - group_id
        properties:
          organization:
            entity: party
          member:
            entity: member
```
{% endcode %}

When loaded to Aleph, this mapping would now show browsable entities for the member and each party, and list the memberships on each of their profile pages. You can also export this data [to a more conventional node-graph data model](followthemoney/ftm.md#exporting-data-to-a-network-graph) for use in Neo4J or Gephi.

## **A more realistic complex mapping**

The companies registry of the Republic of Moldova is an open dataset that consists of three separate source files that, taken together, produce a graph of company information, ownership and management:

* `companies.csv` with companies' details like name, id, address, incorporation date;
* `directors.csv` with names of directors and their details;
* `founders.csv` also with names and details of the founding entities \(i.e. major shareholders\).

The mapping example given below describes the relationship between the companies stored in `companies.csv` and directors and founders, stored in `directors.csv` and `founders.csv` respectively.

{% code title="moldova.yml" %}
```yaml
# The name of the mapping that would become the foreign_id of the collection
# on Aleph.
md_companies:
  queries:
    - csv_url: http://assets.data.occrp.org/tools/aleph/fixtures/md_companies/companies.csv
# Entity definition section.
      entities:
# This is an arbitrary entity name that will be used throughout this query
# section of the mapping.
        company:
# Entity schema type from Follow the Money model.
          schema: Company
# List of columns that are used as unique identifiers for each record.
# Could also be viewed as record aggregation when there are several
# records for the same company that differ only in, for example, address
# field. In this case the resulting entity will contain address values
# merged from different source data records.
          keys:
            - IDNO
            - Denumirea_completă
# A set of properties that describe the chosen schema type.
# For each property one or several columns can be used to get value from.
# A literal string value could be given instead of a column value,
# e.g. for a country code.
          properties:
            name:
              column: Denumirea_completă
            registrationNumber:
              column: IDNO
            incorporationDate:
              column: Data_înregistrării
            address:
              column: Adresa
            jurisdiction:
              literal: MD
            legalForm:
              column: Forma_org
            status:
              column: Statutul
    - csv_url: http://assets.data.occrp.org/tools/aleph/fixtures/md_companies/directors.csv
# With this query Director records are loaded and the Directorship
# relation is defined between Directors and Companies.
      entities:
# Again a Company entity is constructed using the same set of keys
# as in the query above in order to be referred to in the Directorship
# event definition.
        company:
          schema: Company
          keys:
            - Company_IDNO
            - Company_Name
        director:
          schema: LegalEntity
          keys:
            - Company_Name
            - Company_IDNO
            - Director
          properties:
            name:
              column: Director
# To only include records that have a non-empty `Director` column.
              required: true
        directorship:
          schema: Directorship
# To avoid key collision between directors and directorships an additional
# literal string value is given with `key_literal`.
          key_literal: Directorship
          keys:
            - Company_Name
            - Company_IDNO
            - Director
          properties:
# Linking together directors and companies, where the director and
# organization properties of the Directorship interval contain references
# to the director and company entities that were constructed previously.
            director:
              entity: director
              required: true
            organization:
              entity: company
              required: true
            role:
              literal: director
# Similar to directors, in order to link founders to companies through
# an ownership event th company and founder entities have to be declared
# again in each query sectio.
    - csv_url: http://assets.data.occrp.org/tools/aleph/fixtures/md_companies/founders.csv
      entities:
        company:
          schema: Company
          keys:
            - Company_IDNO
            - Company_Name
        founder:
          schema: LegalEntity
          keys:
            - Company_Name
            - Company_IDNO
            - Founder
          properties:
            name:
              column: Founder
              required: true
        ownership:
          schema: Ownership
          key_literal: Ownership
          keys:
            - Company_Name
            - Company_IDNO
            - Founder
          properties:
            owner:
              entity: founder
              required: true
            asset:
              entity: company
              required: true
            role:
              literal: founder
# In case there're extra tables with data that has to be linked companies,
# the the same set of keys is repeated and the relevant properties
# are declared.
    - csv_url: http://assets.data.occrp.org/tools/aleph/fixtures/md_companies/licensed.csv
      entities:
        company:
          schema: Company
          keys:
            - Company_IDNO
            - Company_Name
          properties:
            sector:
              column: Denumire
    - csv_url: http://assets.data.occrp.org/tools/aleph/fixtures/md_companies/unlicensed.csv
      entities:
        company:
          schema: Company
          keys:
            - Company_IDNO
            - Company_Name
          properties:
            sector:
              column: Denumire
            caemCode:
              column: Cod_CAEM
```
{% endcode %}

## Generating unique keys

When creating entities from a dataset, each generated entity must be assigned a unique ID. This ID is computed from the `keys` defined in the mapping file. When writing the file, it is therefore necessary to understand what combination of source columns from the original table can be used to uniquely identify an entity in the context of a dataset. Failing to do so will result in "key collisions", a  problem that results in variety or errors which are sometimes hard to diagnose:

* Entities' properties contain values from different unrelated records \(e.g. addresses, dates of birth\);
* Wrong entity types \(`Persons` are generated as `LegalEntities` instead\)
* Related entities are merged together in various ways;
* Error messages are shown when trying to load the mapping \(e.g. `Cannot index abstract schema` or `No common ancestor: ...` \)

For example, given a table of people with their personal details the mapping below might not always be valid, because different people can have the same first and last name \(and thus a key collision will happen\).

{% code title="bad.yml" %}
```yaml
entities:
  person:
    schema: Person
    keys:
      - FirstName
      - LastName
    properties:
      firstName:
        column: FirstName
      lastName:
        column: LastName
      birthDate:
        column: DoB
```
{% endcode %}

The solution is to include in the list of keys as many properties as is necessary and sufficient to eliminate any intersection between unrelated entities of the same type.

{% code title="good.yml" %}
```yaml
entities:
  person:
    schema: Person
    keys:
      - FirstName
      - LastName
      - DoB
    properties:
      firstName:
        column: FirstName
      lastName:
        column: LastName
      birthDate:
        column: DoB
```
{% endcode %}

Keys for events \(Ownership, Sanction, Family\) will usually be a product of keys of the entities that such an event links together.

{% code title="combined.yml" %}
```yaml
entities:
  company:
    schema: Company
    keys:
      - company_name
  owner:
    schema: Person
    keys:
      - owner_name
  ownership:
    schema: Ownership
    keys:
      - company_name
      - owner_name
```
{% endcode %}

## Loading a mapping from a SQL database

In the examples shown above, data has been loaded from CSV files. The mapping system can also connect to a SQL database using SQLAlchemy. Depending on the database system used, further Python drivers \(such as `psycopg2` or `mysqlclient`\) might be required for specific backends.

When loading from a SQL database, you can begin your query with a specification of the tables you wish to access, and how they should be joined:

{% code title="database.yml" %}
```yaml
za_cipc:
  queries:  
  - database: postgresql://localhost/cipc
    tables:
    - table: za_cipc_companies
      alias: companies
    - table: za_cipc_directors
      alias: directors
    joins:
    - left: companies.regno
      right: directors.company_regno
```
{% endcode %}

Please note that when you query more than one table at the same time, all the column names used in the mapping need to be qualified with the table name, ie. `companies.name` or `directors.name` instead of just `name`.

Mappings support substitution of environment variables. Instead of storing your database credentials to a mapping file, you might want to reference an environment variable like `${DATABASE_URI}` in the mapping file, and define the username and password externally.

## Filtering source data

When loading data from a mapping, you may sometimes want to filter the data so that only part of a table is imported. FtM mappings will only let you do equality filters; anything more complex than that should be considered data cleaning and be done prior to executing the mapping.

{% code title="filters.yml" %}
```yaml
gb_parliament_57:
  queries:
  - csv_url: http://bit.ly/uk-mps-csv
    filters:
      group: "Conservative"
    filters_not:
      gender: "male" 
    entities:
      member:
        schema: Person
        keys:
        - id
        properties:
          name:
            column: name
```
{% endcode %}

## Extra functions for property values

Mapping a column value to a property is normally a straight copy operation:

```yaml
[...]
properties:
  name:
    column: person_name 
```

There are some tricks available, however:

{% code title="hacks.yml" %}
```yaml
# Setting multiple values for a property:
properties:
  name:
    columns:
    - person_name
    - maiden_name

# Merging values ad-hoc:
properties:
  name:
    columns:
    - first_name
    - last_name
    join: " "

# Setting a constant value:
properties:
  country:
    literal: "SS"

# Defining a date format:
properties:
  birthDate:
    column: dob
    format: "%d.%m.%Y"
```
{% endcode %}

In general, we are not seeking to incorporate further data cleaning functionality into the mapping process. It's generally a good idea to design your data pipeline such that loading entities via a mapping is preceded by data cleanup step in which necessary normalisations are applied.

## Loading a mapping

Mapping files can be loaded in two different ways — either from an aleph shell:

```bash
aleph bulkload mapping.yml
```

 or by using a combination of [`followthemoney-util`](https://docs.alephdata.org/developers/ftm) and [`alephclient`](https://docs.alephdata.org/developers/alephclient) command-line tools:

```text
ftm map mapping.yml | ftm aggregate | alephclient write-entities -f dataset_name
```

