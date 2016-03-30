
TYPE_DOCUMENT = 'document'
TYPE_RECORD = 'record'

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
        "source_id": {"type": "integer", "index": "not_analyzed"},
        "source_url": {"type": "string", "index": "not_analyzed"},
        "extension": {"type": "string", "index": "not_analyzed"},
        "languages": {"type": "string", "index": "not_analyzed"},
        "countries": {"type": "string", "index": "not_analyzed"},
        "keywords": {"type": "string", "index": "not_analyzed"},
        "dates": {"type": "date", "format": "yyyy-MM-dd"},
        "mime_type": {"type": "string", "index": "not_analyzed"},
        "summary": {"type": "string", "index": "analyzed"},
        "summary_latin": {"type": "string", "index": "analyzed"},
        "created_at": {"type": "date", "index": "not_analyzed"},
        "updated_at": {"type": "date", "index": "not_analyzed"},
        "entities": {
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "integer", "index": "not_analyzed"},
                "entity_id": {"type": "integer", "index": "not_analyzed"},
                "watchlist_id": {"type": "integer", "index": "not_analyzed"},
                "collection_id": {"type": "integer", "index": "not_analyzed"},
                "name": {"type": "string", "index": "not_analyzed"},
                "category": {"type": "string", "index": "not_analyzed"},
                "weight": {"type": "string", "index": "not_analyzed"}
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
        "source_id": {"type": "integer", "index": "not_analyzed"},
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
