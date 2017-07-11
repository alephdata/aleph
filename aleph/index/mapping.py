
TYPE_COLLECTION = 'collection'
TYPE_DOCUMENT = 'document'
TYPE_RECORD = 'record'
TYPE_ENTITY = 'entity'
TYPE_LINK = 'link'
TYPE_LEAD = 'lead'


COLLECTION_MAPPING = {
    "_all": {
        "enabled": True
    },
    "dynamic_templates": [
        {
            "fields": {
                "match": "$schemata.*",
                "mapping": {
                    "type": "keyword"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "label": {"type": "text"},
        "name_sort": {"type": "keyword"},
        "roles": {"type": "long"},
        "foreign_id": {"type": "keyword"},
        "languages": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "category": {"type": "keyword"},
        "summary": {"type": "text"},
        "managed": {"type": "boolean", "index": "not_analyzed"},
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"},
        "$total": {"type": "long"},
        "$entities": {"type": "long"},
        "$documents": {"type": "long"},
        "$schemata": {"type": "object"},
        "creator": {
            "type": "object",
            "properties": {
                "id": {"type": "long"},
                "type": {"type": "keyword"},
                "name": {"type": "keyword"}
            }
        },
    }
}

DOCUMENT_MAPPING = {
    "_all": {
        "enabled": True
    },
    "date_detection": False,
    "properties": {
        "title": {"type": "text"},
        "name_sort": {"type": "keyword"},
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "type": {"type": "keyword"},
        "status": {"type": "keyword"},
        "crawler": {"type": "keyword"},
        "crawler_run": {"type": "keyword"},
        "error_message": {"type": "text"},
        "content_hash": {"type": "keyword"},
        "foreign_id": {"type": "keyword"},
        "file_name": {"type": "keyword"},
        "collection_id": {"type": "long"},
        "roles": {"type": "long"},
        "uploader_id": {"type": "long"},
        "$children": {"type": "long"},
        "source_url": {"type": "keyword"},
        "extension": {"type": "keyword"},
        "mime_type": {"type": "keyword"},
        "encoding": {"type": "keyword"},
        "languages": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "keywords": {"type": "keyword"},
        "columns": {"type": "keyword"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},  # noqa
        "author": {"type": "text"},
        "summary": {"type": "text"},
        "text": {"type": "text"},
        "parent": {
            "type": "object",
            "properties": {
                "id": {"type": "long"},
                "type": {"type": "keyword"},
                "title": {"type": "keyword"}
            }
        },
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"},
    }
}

RECORD_MAPPING = {
    "_all": {
        "enabled": True
    },
    "date_detection": False,
    "properties": {
        "collection_id": {"type": "long"},
        "document_id": {"type": "long"},
        "index": {"type": "long"},
        "sheet": {"type": "long"},
        "text": {"type": "text"}
    }
}

ENTITY_MAPPING = {
    "_all": {
        "enabled": True
    },
    "dynamic_templates": [
        {
            "fields": {
                "match": "properties.*",
                "mapping": {
                    "type": "text"
                }
            }
        },
        {
            "fields": {
                "match": "data.*",
                "mapping": {
                    "type": "keyword"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "name": {"type": "text"},
        "name_sort": {"type": "keyword"},
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "text": {"type": "text"},
        "collection_id": {"type": "long"},
        "roles": {"type": "long"},
        "foreign_ids": {"type": "keyword"},
        "fingerprints": {"type": "text"},
        "names": {"type": "text"},
        "identifiers": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},  # noqa
        "emails": {"type": "keyword"},
        "phones": {"type": "keyword"},
        "addresses": {"type": "text"},
        "properties": {"type": "object"},
        "data": {"type": "object"},
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"},
        "$documents": {"type": "long"},
        "$bulk": {"type": "boolean"}
    }
}

LINK_MAPPING = {
    "_all": {
        "enabled": True
    },
    "dynamic_templates": [
        {
            "fields": {
                "match": "properties.*",
                "mapping": {
                    "type": "text"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "dataset": {"type": "keyword"},
        "collection_id": {"type": "long"},
        "roles": {"type": "long"},
        "fingerprints": {"type": "text"},
        "names": {"type": "text"},
        "identifiers": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},  # noqa
        "emails": {"type": "keyword"},
        "phones": {"type": "keyword"},
        "addresses": {"type": "text"},
        "text": {"type": "text"},
        "properties": {"type": "object"},
        "origin": {
            "type": "object",
            "properties": {
                "id": {"type": "keyword"},
                "fingerprints": {"type": "keyword"}
            }
        },
        "remote": {
            "type": "object",
            "properties": ENTITY_MAPPING.get('properties')
        }
    }
}

LEAD_MAPPING = {
    "_all": {
        "enabled": False
    },
    "date_detection": False,
    "properties": {
        "entity_id": {"type": "keyword"},
        "entity_collection_id": {"type": "long"},
        "score": {"type": "double"},
        "match_id": {"type": "keyword"},
        "judgement": {"type": "integer"},
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "roles": {"type": "long"},
        "collection_id": {"type": "long"},
    }
}
