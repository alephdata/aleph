from normality import ascii_text
from aleph.util import ensure_list
from aleph.text import index_form


def finalize_index(data, schema):
    """Apply final denormalisations to the index."""
    properties = data.get('properties', {})

    texts = []
    for vs in properties.values():
        for v in ensure_list(vs):
            texts.append(v)

    data['text'] = index_form(texts)
    data['fingerprints'] = data.get('fingerprints', [])

    # Generate inverted representations of the data stored in properties.
    for prop in schema.properties:
        values = properties.get(prop.name, [])
        if not len(values):
            continue

        # Find an set the name property
        if prop.is_label:
            data['name'] = values[0]

        # Generate key material
        # TODO: this should probably be record-based.
        data['fingerprints'].extend(prop.type.fingerprint(values))

        # Add inverted properties. This takes all the properties
        # of a specific type (names, dates, emails etc.)
        invert = prop.type.index_invert
        if invert:
            if invert not in data:
                data[invert] = []
            for norm in prop.type.normalize(values):
                if norm not in data[invert]:
                    data[invert].append(norm)

    data['fingerprints'] = list(set(data['fingerprints']))

    # Add latinised names
    names = data.get('names', [])
    for name in list(names):
        names.append(ascii_text(name))
    data['names'] = list(set(names))

    # Get implied schemata (i.e. parents of the actual schema)
    data['schema'] = schema.name
    data['schemata'] = []
    for parent in schema.schemata:
        if not parent.hidden:
            data['schemata'].append(parent.name)

    # Second name field for non-tokenised sorting.
    if 'name' in data:
        data['name_sort'] = data.get('name')
    return data
