import json
from banal import ensure_list
# from normality import safe_filename


def pack_cells(cells):
    return json.dumps(cells)


def unpack_cells(cells):
    try:
        return ensure_list(json.dumps(cells))
    except Exception:
        return []
