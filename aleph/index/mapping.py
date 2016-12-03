
TYPE_DOCUMENT = 'document'
TYPE_RECORD = 'record'
TYPE_ENTITY = 'entity'
TYPE_LINK = 'link'

DOCUMENT_MAPPING = {
    "_all": {
        "enabled": True
    },
    "dynamic_templates": [
        {
            "text": {
                "match": "parent.*",
                "mapping": {
                    "type": "string"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "title": {"type": "string", "index": "analyzed"},
        "title_latin": {"type": "string", "index": "analyzed"},
        "content_hash": {"type": "string", "index": "not_analyzed"},
        "file_name": {"type": "string", "index": "not_analyzed"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "source_url": {"type": "string", "index": "not_analyzed"},
        "extension": {"type": "string", "index": "not_analyzed"},
        "languages": {"type": "string", "index": "not_analyzed"},
        "countries": {"type": "string", "index": "not_analyzed"},
        "recipients": {"type": "string", "index": "not_analyzed"},
        "keywords": {"type": "string", "index": "not_analyzed"},
        "emails": {"type": "string", "index": "not_analyzed"},
        "urls": {"type": "string", "index": "not_analyzed"},
        "domains": {"type": "string", "index": "not_analyzed"},
        "phone_numbers": {"type": "string", "index": "not_analyzed"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},
        "mime_type": {"type": "string", "index": "not_analyzed"},
        "author": {"type": "string", "index": "not_analyzed"},
        "summary": {"type": "string", "index": "analyzed"},
        "summary_latin": {"type": "string", "index": "analyzed"},
        "created_at": {"type": "date", "index": "not_analyzed"},
        "updated_at": {"type": "date", "index": "not_analyzed"},
        "entities": {
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "collection_id": {"type": "integer", "index": "not_analyzed"}
            }
        },
    }
}

RECORD_MAPPING = {
    "_all": {
        "enabled": True
    },
    "_parent": {
        "type": TYPE_DOCUMENT
    },
    "dynamic_templates": [
        {
            "fields": {
                "match": "raw.*",
                "mapping": {
                    "type": "string",
                    "index": "not_analyzed"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "type": {"type": "string", "index": "not_analyzed"},
        "content_hash": {"type": "string", "index": "not_analyzed"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "document_id": {"type": "integer", "index": "not_analyzed"},
        "sheet": {"type": "integer", "index": "not_analyzed"},
        "row_id": {"type": "integer", "index": "not_analyzed"},
        "page": {"type": "integer", "index": "not_analyzed"},
        "text": {"type": "string", "index": "analyzed"},
        "text_latin": {"type": "string", "index": "analyzed"},
        "raw": {
            "type": "object"
        }
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
                    "type": "string",
                    "index": "analyzed"
                }
            }
        },
        {
            "fields": {
                "match": "data.*",
                "mapping": {
                    "type": "string",
                    "index": "not_analyzed"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "name": {"type": "string", "index": "analyzed"},
        "name_sort": {"type": "string", "index": "not_analyzed"},
        "schema": {"type": "string", "index": "not_analyzed"},
        "schemata": {"type": "string", "index": "not_analyzed"},
        "dataset": {"type": "string", "index": "not_analyzed"},
        "groups": {"type": "string", "index": "not_analyzed"},
        "text": {"type": "string", "index": "analyzed"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "doc_count": {"type": "long", "index": "not_analyzed"},
        "fingerprints": {"type": "string", "index": "not_analyzed"},
        "countries": {"type": "string", "index": "not_analyzed"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},
        "emails": {"type": "string", "index": "not_analyzed"},
        "phones": {"type": "string", "index": "not_analyzed"},
        "addresses": {"type": "string", "index": "not_analyzed"},
        "properties": {"type": "nested"},
        "data": {"type": "nested"},
        "created_at": {"type": "date", "index": "not_analyzed"},
        "updated_at": {"type": "date", "index": "not_analyzed"},
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
                    "type": "string",
                    "index": "not_analyzed"
                }
            }
        }
    ],
    "date_detection": False,
    "properties": {
        "schema": {"type": "string", "index": "not_analyzed"},
        "schemata": {"type": "string", "index": "not_analyzed"},
        "dataset": {"type": "string", "index": "not_analyzed"},
        "groups": {"type": "string", "index": "not_analyzed"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "text": {"type": "string", "index": "analyzed"},
        "properties": {"type": "nested"},
        "origin": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "fingerprints": {"type": "string", "index": "not_analyzed"}
            }
        },
        "remote": {
            "type": "object",
            "include_in_all": True,
            "properties": ENTITY_MAPPING.get('properties')
        }
    }
}
