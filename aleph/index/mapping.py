
TYPE_DOCUMENT = 'document'
TYPE_RECORD = 'record_v2'
TYPE_ENTITY = 'entity'
TYPE_LINK = 'link'
TYPE_LEAD = 'lead'

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
        "parent_id": {"type": "integer", "index": "not_analyzed"},
        "title": {"type": "text", "index": "analyzed"},
        "title_latin": {"type": "text", "index": "analyzed"},
        "name_sort": {"type": "keyword"},
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "status": {"type": "keyword"},
        "crawler": {"type": "string", "index": "not_analyzed"},
        "crawler_run": {"type": "string", "index": "not_analyzed"},
        "error_type": {"type": "string", "index": "not_analyzed"},
        "error_message": {"type": "string", "index": "analyzed"},
        "error_details": {"type": "string", "index": "analyzed"},
        "content_hash": {"type": "keyword"},
        "file_name": {"type": "keyword"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "roles": {"type": "long", "index": "not_analyzed"},
        "source_url": {"type": "keyword"},
        "extension": {"type": "keyword"},
        "languages": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "recipients": {"type": "keyword"},
        "keywords": {"type": "keyword"},
        "emails": {"type": "keyword"},
        "urls": {"type": "keyword"},
        "domains": {"type": "keyword"},
        "phone_numbers": {"type": "keyword"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},  # noqa
        "mime_type": {"type": "keyword"},
        "author": {"type": "text", "index": "not_analyzed"},
        "summary": {"type": "text", "index": "analyzed"},
        "summary_latin": {"type": "text", "index": "analyzed"},
        "text": {"type": "text", "index": "analyzed"},
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
    "date_detection": False,
    "properties": {
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "document_id": {"type": "integer", "index": "not_analyzed"},
        "index": {"type": "integer", "index": "not_analyzed"},
        "sheet": {"type": "integer", "index": "not_analyzed"},
        "text": {"type": "string", "index": "analyzed"}
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
                    "type": "text",
                    "index": "analyzed"
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
        "name": {"type": "string", "index": "analyzed"},
        "name_sort": {"type": "keyword"},
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "dataset": {"type": "keyword"},
        "roles": {"type": "long", "index": "not_analyzed"},
        "text": {"type": "string", "index": "analyzed"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "roles": {"type": "long", "index": "not_analyzed"},
        "foreign_ids": {"type": "keyword"},
        "doc_count": {"type": "long", "index": "not_analyzed"},
        "fingerprints": {"type": "keyword"},
        "names": {"type": "string", "index": "not_analyzed"},
        "identifiers": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},  # noqa
        "emails": {"type": "keyword"},
        "phones": {"type": "keyword"},
        "addresses": {"type": "keyword"},
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
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "dataset": {"type": "keyword"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
        "roles": {"type": "long", "index": "not_analyzed"},
        "fingerprints": {"type": "keyword"},
        "names": {"type": "keyword"},
        "identifiers": {"type": "keyword"},
        "countries": {"type": "keyword"},
        "dates": {"type": "date", "format": "yyyy-MM-dd||yyyy-MM||yyyy-MM-d||yyyy-M||yyyy"},  # noqa
        "emails": {"type": "keyword"},
        "phones": {"type": "keyword"},
        "addresses": {"type": "keyword"},
        "text": {"type": "string", "index": "analyzed"},
        "properties": {"type": "nested"},
        "origin": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "index": "not_analyzed"},
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
    "_all": {"enabled": False},
    "date_detection": False,
    "properties": {
        "entity_id": {"type": "string", "index": "not_analyzed"},
        "entity_collection_id": {"type": "long", "index": "not_analyzed"},
        "score": {"type": "double", "index": "not_analyzed"},
        "match_id": {"type": "string", "index": "not_analyzed"},
        "judgement": {"type": "integer", "index": "not_analyzed"},
        "schema": {"type": "keyword"},
        "schemata": {"type": "keyword"},
        "dataset": {"type": "keyword"},
        "roles": {"type": "long", "index": "not_analyzed"},
        "collection_id": {"type": "integer", "index": "not_analyzed"},
    }
}
