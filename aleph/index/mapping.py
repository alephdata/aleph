
TYPE_DOCUMENT = 'document'
TYPE_RECORD = 'record'
TYPE_ENTITY = 'entity'

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
        "recipients": {"type": "string", "index": "not_analyzed"},
        "keywords": {"type": "string", "index": "not_analyzed"},
        "dates": {"type": "date", "format": "yyyy-MM-dd"},
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
                "uuid": {"type": "string", "index": "not_analyzed"},
                "collection_id": {"type": "integer", "index": "not_analyzed"},
                "name": {"type": "string", "index": "not_analyzed"},
                "$schema": {"type": "string", "index": "not_analyzed"},
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

ENTITY_MAPPING = {
    "_all": {
        "enabled": True
    },
    "date_detection": False,
    "properties": {
        "name": {"type": "string", "index": "analyzed"},
        "name_latin": {"type": "string", "index": "analyzed"},
        "terms": {"type": "string", "index": "analyzed"},
        "terms_latin": {"type": "string", "index": "analyzed"},
        "collection_id": {"type": "integer", "index": "analyzed"},
        "collections": {"type": "integer", "index": "analyzed"},
        "$schema": {"type": "string", "index": "not_analyzed"},
        "summary": {"type": "string", "index": "analyzed"},
        "summary_latin": {"type": "string", "index": "analyzed"},
        "description": {"type": "string", "index": "analyzed"},
        "description_latin": {"type": "string", "index": "analyzed"},
        "jurisdiction_code": {"type": "string", "index": "not_analyzed"},
        "created_at": {"type": "date", "index": "not_analyzed"},
        "updated_at": {"type": "date", "index": "not_analyzed"},
        "identifiers": {
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "identifier": {"type": "string", "index": "not_analyzed"},
                "scheme": {"type": "string", "index": "not_analyzed"}
            }
        },
        "contact_details": {
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "label": {"type": "string", "index": "analyzed"},
                "type": {"type": "string", "index": "not_analyzed"},
                "value": {"type": "string", "index": "not_analyzed"},
                "note": {"type": "string", "index": "analyzed"},
                "valid_from": {"type": "date", "index": "analyzed"},
                "valid_until": {"type": "date", "index": "analyzed"}
            }
        },
        "other_names": {
            "type": "nested",
            "include_in_parent": True,
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
                "name": {"type": "string", "index": "analyzed"},
                "display_name": {"type": "string", "index": "analyzed"},
                "note": {"type": "string", "index": "analyzed"},
                "start_date": {"type": "date", "index": "analyzed"},
                "end_date": {"type": "date", "index": "analyzed"}
            }
        },
    }
}
