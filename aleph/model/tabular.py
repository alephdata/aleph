from normality import slugify


class TabularColumn(object):

    def __init__(self, schema, data):
        self.schema = schema
        self.data = data
        self.label = data.get('label')
        self.name = data.get('name')

    def __repr__(self):
        return '<TabularColumn(%r,%r)>' % (self.label, self.name)


class Tabular(object):

    def __init__(self, schema=None):
        self.schema = schema or {}
        if 'columns' not in self.schema:
            self.schema['columns'] = []

    def add_column(self, label):
        label = unicode(label)
        column = slugify(label or '', sep='_')
        column = column or 'column'
        column = column[:55]
        name, i = column, 2
        # de-dupe: column, column_2, column_3, ...
        while name in [c.name for c in self.columns]:
            name = '%s_%s' % (name, i)
            i += 1
        column = {'label': label, 'name': column}
        self.schema['columns'].append(column)
        return TabularColumn(self, column)

    @property
    def sheet(self):
        return self.schema.get('sheet')

    @property
    def sheet_name(self):
        name = self.schema.get('sheet_name')
        if name is not None:
            return name
        return 'Sheet %s' % self.sheet

    @property
    def columns(self):
        for col in self.schema['columns']:
            yield TabularColumn(self, col)

    def to_dict(self):
        data = self.schema
        data['sheet'] = self.sheet
        data['sheet_name'] = self.sheet_name
        return data

    def __repr__(self):
        return '<Tabular(%r)>' % list(self.columns)
