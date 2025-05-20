# Integrating the Python Library

OpenAleph's Python library provides programmatic access to your instance. You can upload files, ingest structured data, and build custom graphs of entities and relationships - all from Python scripts.

Make sure you also familiarize yourself with the [FtM API and its tooling](https://followthemoney.tech/docs/api/)!

## Authentication

As discussed before, you can configure your Aleph host and API key via environment variables:

```bash
export OPAL_HOST=https://your-aleph-instance.org
export OPAL_API_KEY=your_api_key
```

Alternatively, you can pass credentials when creating the client:

```python
from openaleph.api import AlephAPI

api = AlephAPI(host='https://your-aleph-instance.org', api_key='your_api_key')
```

## Uploading Documents

Use `ingest_upload` to upload a file or create folders:

```python
from openaleph.api import AlephAPI
from pathlib import Path

api = AlephAPI()

# Upload a PDF document to a collection
api.ingest_upload(collection_id='my-collection', file_path=Path('reports/report.pdf'))

# Create an empty folder in the collection
api.ingest_upload(collection_id='my-collection', metadata={'name': 'Batch Upload'})
```

## Ingesting Tabular Data

Transform rows of a CSV file into structured entities:

```python
import csv
from openaleph.api import AlephAPI
from openaleph.util import prop_push
from pathlib import Path

api = AlephAPI()
collection_id = 'my-collection'

with open('data/companies.csv') as f:
    reader = csv.DictReader(f)
    entities = []
    for row in reader:
        entity = {'schema': 'LegalEntity', 'properties': {}}
        prop_push(entity, 'name', row['Company Name'])
        prop_push(entity, 'jurisdiction', row['Country'])
        prop_push(entity, 'registrationNumber', row['RegistrationNumber'])
        entities.append(entity)

api.write_entities(collection_id=collection_id, entities=entities)
```

This creates new entities in your collection based on CSV rows.

## Building Entity Graphs

Group entities into a graph for visualization:

```python
# Create a graph entityset
entityset = api.create_entityset(
    collection_id='my-collection',
    type='graph',
    label='Ownership Graph',
    summary='Company ownership relationships'
)

# Define relationship edges
edges = [
    {
        'schema': 'Directorship',
        'properties': {
            'director': 'person_entity_id',
            'organization': 'company_entity_id'
        }
    },
    # Add more edges as needed
]

# Write edges to the entityset
api.write_entities(
    collection_id='my-collection',
    entities=edges,
    entityset_id=entityset['id']
)
```

After writing, you can visualize the graph in the Aleph web interface.

---

By combining file uploads, structured data ingestion, and entity-graph creation, the OpenAleph Python client supports end-to-end workflows for investigative data pipelines.
