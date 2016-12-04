from aleph.util import ensure_list
from aleph.text import string_value, latinize_text, category_replace


def finalize_index(data, schema):
    """Apply final denormalisations to the index."""
    properties = data.get('properties', {})

    text = set()
    for vs in properties.values():
        for v in ensure_list(vs):
            v = string_value(v)
            if v is None or len(v) < 2:
                continue
            v = v.strip()
            text.add(v)
            v = latinize_text(v)
            text.add(v)
            v = category_replace(v)
            text.add(v)
    data['text'] = list(text)

    # Generate inverted representations of the data stored in properties.
    for prop in schema.properties:
        values = properties.get(prop.name, [])
        if not len(values):
            continue

        # Find an set the name property
        if prop.is_label:
            data['name'] = values[0]

        # Add inverted properties. This takes all the properties
        # of a specific type (names, dates, emails etc.)
        invert = prop.type.index_invert
        if invert:
            if invert not in data:
                data[invert] = []
            for norm in prop.type.normalize(values):
                if norm not in data[invert]:
                    data[invert].append(norm)

    # Get implied schemata (i.e. parents of the actual schema)
    data['schema'] = schema.name
    data['schemata'] = []
    for parent in schema.schemata:
        if not parent.is_hidden:
            data['schemata'].append(parent.name)

    # Second name field for non-tokenised sorting.
    if 'name' in data:
        data['name_sort'] = data.get('name')
    return data
