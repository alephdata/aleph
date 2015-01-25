
CARD_MAPPING = {
    "_id": {
        "path": "id"
    },
    "_all": {
        "enabled": True
    },
    "dynamic": "strict",
    "properties": {
        "id": {"type": "string", "index": "not_analyzed"},
        "title": {"type": "string", "index": "analyzed"},
        "summary": {"type": "string", "index": "analyzed"},
        "category": {"type": "string", "index": "not_analyzed"},
        "text": {"type": "string", "index": "analyzed"},
        "aliases": {"type": "string", "index": "analyzed"},
        "created_at": {"type": "date", "index": "not_analyzed"},
        "updated_at": {"type": "date", "index": "not_analyzed"},
        "author": {
            "_id": {
                "path": "id"
            },
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "display_name": {"type": "string", "index": "not_analyzed"}
            }
        },
        "references": {
            "_id": {
                "path": "id"
            },
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "citation": {"type": "string", "index": "analyzed"},
                "score": {"type": "integer", "index": "not_analyzed"},
                "url": {"type": "string", "index": "not_analyzed"},
                "source": {"type": "string", "index": "not_analyzed"},
                "source_url": {"type": "string", "index": "not_analyzed"}
            }
        },
        "links": {
            "_id": {
                "path": "id"
            },
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "title": {"type": "string", "index": "analyzed"},
                "category": {"type": "string", "index": "not_analyzed"},
                "rejected": {"type": "boolean", "index": "not_analyzed"},
                "status": {"type": "string", "index": "not_analyzed"},
                "offset": {"type": "integer", "index": "not_analyzed"}
            }
        }
    }
}
