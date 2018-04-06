
PARTIAL_DATE = "yyyy-MM-dd'T'HH:mm:ss||yyyy-MM-dd||yyyy-MM||yyyy"

COLLECTION_MAPPING = {
    "dynamic_templates": [
        {
            "fields": {
                "match": "schemata.*",
                "mapping": {
                    "type": "keyword"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "label": {
            "type": "text",
            "fields": {
                "kw": {
                    "type": "keyword"
                }
            }
        },
        "roles": {"type": "long"},
        "foreign_id": {"type": "keyword"},
        "languages": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "category": {"type": "keyword"},
        "summary": {"type": "text"},
        "publisher": {"type": "keyword"},
        "publisher_url": {"type": "keyword"},
        "data_url": {"type": "keyword"},
        "info_url": {"type": "keyword"},
        "kind": {"type": "keyword"},
        "text": {"type": "text"},
        "casefile": {"type": "boolean"},
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"},
        "count": {"type": "long"},
        "schemata": {
            "type": "object"
        },
        "creator": {
            "type": "object",
            "properties": {
                "id": {"type": "keyword"},
                "type": {"type": "keyword"},
                "name": {
                    "type": "text",
                    "fields": {
                        "kw": {
                            "type": "keyword"
                        }
                    }
                }
            }
        },
    }
}

RECORD_MAPPING = {
    "date_detection": False,
    "properties": {
        "collection_id": {"type": "keyword"},
        "document_id": {"type": "keyword"},
        "index": {"type": "long"},
        "sheet": {"type": "long"},
        "text": {"type": "text"}
    }
}

ENTITY_MAPPING = {
    "date_detection": False,
    "properties": {
        "title": {"type": "text"},
        "name": {
            "type": "text",
            "fields": {
                "kw": {
                    "type": "keyword"
                }
            }
        },
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "kind": {"type": "keyword"},
        "bulk": {"type": "boolean"},
        "status": {"type": "keyword"},
        "error_message": {"type": "text"},
        "matches": {"type": "keyword"},
        "distinct": {"type": "keyword"},
        "content_hash": {"type": "keyword"},
        "foreign_id": {"type": "keyword"},
        "file_name": {"type": "keyword"},
        "collection_id": {"type": "keyword"},
        "roles": {"type": "long"},
        "uploader_id": {"type": "long"},
        "children": {"type": "long"},
        "source_url": {"type": "keyword"},
        "extension": {"type": "keyword"},
        "mime_type": {"type": "keyword"},
        "encoding": {"type": "keyword"},
        "entities": {"type": "keyword"},
        "languages": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "keywords": {"type": "keyword"},
        "fingerprints": {"type": "keyword"},
        "names": {
            "type": "keyword",
            "fields": {
                "text": {
                    "type": "text"
                }
            }
        },
        "emails": {"type": "keyword"},
        "phones": {"type": "keyword"},
        "identifiers": {"type": "keyword"},
        "addresses": {
            "type": "keyword",
            "fields": {
                "text": {
                    "type": "text"
                }
            }
        },
        "columns": {"type": "keyword"},
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"},
        "date": {"type": "date", "format": PARTIAL_DATE},
        "authored_at": {"type": "date", "format": PARTIAL_DATE},
        "modified_at": {"type": "date", "format": PARTIAL_DATE},
        "published_at": {"type": "date", "format": PARTIAL_DATE},
        "retrieved_at": {"type": "date", "format": PARTIAL_DATE},
        "dates": {"type": "date", "format": PARTIAL_DATE},
        "author": {"type": "keyword"},
        "generator": {"type": "keyword"},
        "summary": {"type": "text"},
        "text": {"type": "text"},
        "properties": {
            "type": "object"
        },
        "parent": {
            "type": "object",
            "properties": {
                "id": {"type": "keyword"},
                "type": {"type": "keyword"},
                "title": {"type": "keyword"}
            }
        },
        "ancestors": {"type": "keyword"},
    },
    "dynamic_templates": [
        {
            "fields": {
                "match": "properties.*",
                "mapping": {
                    "type": "keyword"
                }
            }
        }
    ]
}
