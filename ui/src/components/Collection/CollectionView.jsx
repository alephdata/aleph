import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { Icon } from '@blueprintjs/core';

import collectionViewIds from 'components/Collection/collectionViewIds';
import { Count, ResultCount } from 'components/common';
import { queryCollectionEntities, queryCollectionXrefFacets } from 'queries';
import { selectModel, selectEntitiesResult, selectCollectionXrefResult } from 'selectors';

const messages = defineMessages({
  diagrams: {
    id: 'collection.info.diagrams',
    defaultMessage: 'Network diagrams',
  },
  lists: {
    id: 'collection.info.lists',
    defaultMessage: 'Lists',
  },
  xref: {
    id: 'collection.info.xref',
    defaultMessage: 'Cross-reference',
  },
  search: {
    id: 'collection.info.search',
    defaultMessage: 'Search',
  },
  documents: {
    id: 'collection.info.browse',
    defaultMessage: 'Documents',
  },
  entities: {
    id: 'collection.info.entities',
    defaultMessage: 'Entities',
  },
  mappings: {
    id: 'collection.info.mappings',
    defaultMessage: 'Mappings',
  },
  mentions: {
    id: 'collection.info.mentions',
    defaultMessage: 'Mentions',
  },
  overview: {
    id: 'collection.info.overview',
    defaultMessage: 'Overview',
  },
});

const icons = {
  overview: 'grouped-bar-chart',
  documents: 'document',
  entities: 'list-columns',
  xref: 'comparison' ,
  diagrams: 'graph' ,
  mappings: 'new-object' ,
  search: 'search' ,
  lists: 'list' ,
};

const CollectionViewIcon = ({ id, className }) => {
  const icon = icons[id];
  if (!icon) { return null; }
  return <Icon icon={icon} className={className} />
}

class CollectionViewLabel extends PureComponent {
  render() {
    const { icon, id, intl } = this.props;
    if (!id) { return null; }
    const messageKey = messages[id];
    if (!messageKey) { return null; }

    return (
      <>
        {icon && <CollectionViewIcon id={id} className="left-icon" />}
        <span>{intl.formatMessage(messageKey)}</span>
      </>
    );
  }
}

const CollectionViewCount = ({ id, collection, model, xrefResult }) => {
  console.log('in count!', id, collection, model);
  let count;
  switch(id) {
    case 'documents':
    case 'entities':
      const schemaCounts = collection?.statistics?.schema?.values;
      if (schemaCounts) {
        count = 0;
        Object.entries(schemaCounts).forEach(([key, value]) => {
          const schema = model.getSchema(key);
          console.log(schema, schema.isDocument(), key, value)
          if (id === 'entities' && !schema.isDocument() || id === 'documents' && schema.isDocument()) {
            console.log(count, value);
            count += value;
          }
        });
      }
      break;
    case 'xref':
      if (xrefResult) {
        return <ResultCount result={xrefResult} />
      }
      break;
    case 'diagrams':
      count = collection?.counts?.entitysets?.diagram;
      break;
    case 'mappings':
      count = collection?.counts?.mappings;
      break;
    case 'lists':
      count = collection?.counts?.entitysets?.list;
      break;
  }

  if (count) {
    return <Count count={count} />;
  } else {
    return null;
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const xrefQuery = queryCollectionXrefFacets(location, collection.id);

  return ({
    model: selectModel(state),
    xrefResult: selectCollectionXrefResult(state, xrefQuery),
  });
};

export default class CollectionView {
  static Icon = CollectionViewIcon;
  static Label = injectIntl(CollectionViewLabel);
  static Count = compose(withRouter, connect(mapStateToProps))(CollectionViewCount);
}
