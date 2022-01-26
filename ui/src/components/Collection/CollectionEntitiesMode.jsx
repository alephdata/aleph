import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';

import withRouter from 'app/withRouter'
import EntityTable from 'components/EntityTable/EntityTable';
import { selectCollection, selectModel } from 'selectors';
import { collectionEntitiesQuery } from 'queries';

class CollectionEntitiesMode extends React.PureComponent {
  render() {
    const { activeSchema, collection, querySchemaEntities } = this.props;

    return (
      <EntityTable
        query={querySchemaEntities(activeSchema)}
        collection={collection}
        schema={activeSchema}
        writeable={collection.writeable}
        isEntitySet={false}
      />
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, collectionId } = ownProps;

  const model = selectModel(state);
  const collection = selectCollection(state, collectionId);
  const hashQuery = queryString.parse(location.hash);
  const hashType = hashQuery.type;

  const rawCounts = collection?.statistics?.schema?.values || [];
  const schemaCounts = [];
  for (const key in rawCounts) {
    schemaCounts.push({
      id: key,
      count: rawCounts[key],
    });
  }

  const schemata = model.getSchemata()
    .filter((schema) => !schema.isDocument() && !schema.hidden)
    .map((schema) => schema.name);
  const visibleCounts = schemaCounts
    .filter((c) => !model.getSchema(c.id).hidden);

  let addedView;
  if (hashType && !visibleCounts.find(obj => obj.id === hashType)) {
    addedView = { id: hashType, count: 0 };
  } else if (!visibleCounts.length) {
    addedView = { id: 'Person', count: 0 };
  }

  const schemaViews = addedView ? [...visibleCounts, addedView] : visibleCounts;
  const activeType = hashType || schemaViews[0]?.id;
  const selectableSchemata = schemata
    .filter((s) => !schemaViews.find((v) => v.id === s));

  return {
    activeSchema: activeType ? model.getSchema(activeType) : null,
    collection,
    schemaViews,
    selectableSchemata,
    querySchemaEntities: (schema) => collectionEntitiesQuery(location, collectionId, schema.name),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(CollectionEntitiesMode);
