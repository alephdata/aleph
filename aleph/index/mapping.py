
TYPE_DOCUMENT = 'document'
TYPE_PAGE = 'page'
TYPE_RECORD = 'record'

DOCUMENT_MAPPING = {
    "_id": {
        "path": "id"
    },
    "_all": {
        "enabled": True
    },
    "properties": {
        "id": {"type": "integer", "index": "not_analyzed"},
        "title": {"type": "string", "index": "analyzed"},
        "content_hash": {"type": "string", "index": "not_analyzed"},
        "file_name": {"type": "string", "index": "not_analyzed"},
        "source_id": {"type": "string", "index": "not_analyzed"},
        "source_url": {"type": "string", "index": "not_analyzed"},
        "extension": {"type": "string", "index": "not_analyzed"},
        "languages": {"type": "string", "index": "not_analyzed"},
        "countries": {"type": "string", "index": "not_analyzed"},
        "mime_type": {"type": "string", "index": "not_analyzed"},
        "summary": {"type": "string", "index": "analyzed"},
        "text": {"type": "string", "index": "analyzed"},
        "created_at": {"type": "date", "index": "not_analyzed"},
        "updated_at": {"type": "date", "index": "not_analyzed"},
        "entities": {
            "_id": {
                "path": "id"
            },
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "integer", "index": "not_analyzed"},
                "entity_id": {"type": "integer", "index": "not_analyzed"},
                "list_id": {"type": "string", "index": "not_analyzed"},
                "name": {"type": "string", "index": "not_analyzed"},
                "category": {"type": "string", "index": "not_analyzed"},
                "weight": {"type": "string", "index": "not_analyzed"}
            }
        },
    }
}

RECORD_MAPPING = {
    "_id": {
        "path": "id"
    },
    "_all": {
        "enabled": True
    },
    "_parent": {
        "type": TYPE_DOCUMENT,
        "property": "id"
    },
    "properties": {
        "id": {"type": "string", "index": "not_analyzed"},
        "type": {"type": "string", "index": "not_analyzed"},
        "content_hash": {"type": "string", "index": "not_analyzed"},
        "document_id": {"type": "integer", "index": "not_analyzed"},
        "sheet": {"type": "integer", "index": "not_analyzed"},
        "row_id": {"type": "integer", "index": "not_analyzed"},
        "page_number": {"type": "string", "index": "not_analyzed"},
        "text": {"type": "string", "index": "analyzed"},
        "raw": {"type": "object"}
    }
}
