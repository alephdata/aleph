import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import withRouter from 'app/withRouter';
import { selectModel } from 'selectors';
import { collectionSearchQuery } from 'queries';
import { Schema as VLSchema, SchemaSelect } from 'react-ftm';
import CollectionView from 'components/Collection/CollectionView';
import collectionViewIds from 'components/Collection/collectionViewIds';

function SchemaLink({ collection, location, schema, ...rest }) {
  const viewProps = { collection };

  if (schema.isDocument()) {
    return (
      <CollectionView.Link
        collection={collection}
        id={collectionViewIds.DOCUMENTS}
        icon
      />
    );
  } else {
    if (collection.casefile) {
      viewProps.id = collectionViewIds.ENTITIES;
      viewProps.hash = { type: schema };
    } else {
      viewProps.id = collectionViewIds.SEARCH;
      const query = collectionSearchQuery(location, collection.id).setFilter(
        'schema',
        schema
      );
      viewProps.search = query.toLocation();
    }
  }

  return (
    <CollectionView.Link {...viewProps}>
      <VLSchema.Label schema={schema} icon={true} {...rest} />
    </CollectionView.Link>
  );
}

const SchemaDescription = ({ schema }) => {
  return schema.description;
};

const mapStateToProps = (state, ownProps) => {
  const { schema } = ownProps;
  return { schema: selectModel(state).getSchema(schema) };
};

class Schema extends Component {
  static Label = connect(mapStateToProps)(VLSchema.Label);

  static Icon = connect(mapStateToProps)(VLSchema.Icon);

  static Link = compose(withRouter, connect(mapStateToProps))(SchemaLink);

  static Description = connect(mapStateToProps)(SchemaDescription);

  static Select = connect((state) => ({ model: selectModel(state) }))(
    SchemaSelect
  );
}

export default Schema;
