import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';

import { Count, ResultCount } from 'components/common';
import { collectionXrefFacetsQuery } from 'queries';
import { selectCollection, selectModel, selectCollectionXrefResult } from 'selectors';
import getCollectionLink from 'util/getCollectionLink';

const messages = defineMessages({
  diagrams: {
    id: 'collection.info.diagrams',
    defaultMessage: 'Network diagrams',
  },
  diagrams_description: {
    id: 'collection.info.diagrams_description',
    defaultMessage: 'Network diagrams let you visualize complex relationships within an investigation.',
  },
  lists: {
    id: 'collection.info.lists',
    defaultMessage: 'Lists',
  },
  lists_description: {
    id: 'collection.info.lists_description',
    defaultMessage: 'Lists let you organize and group related entities of interest.',
  },
  timelines: {
    id: 'collection.info.timelines',
    defaultMessage: 'Timelines',
  },
  timelines_description: {
    id: 'collection.info.timelines_description',
    defaultMessage: 'Timelines are a way to view and organize events chronologically.',
  },
  xref: {
    id: 'collection.info.xref',
    defaultMessage: 'Cross-reference',
  },
  xref_description: {
    id: 'collection.info.xref_description',
    defaultMessage: 'Cross-referencing allows you to search the rest of Aleph for entities similar to those contained in your investigation.',
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
    defaultMessage: 'Entity mappings',
  },
  mappings_description: {
    id: 'collection.info.mappings_description',
    defaultMessage: 'Entity mappings allow you to bulk generate structured Follow the Money entities (like People, Companies, and the relationships among them) from rows in a spreadsheet or CSV document',
  },
  mentions: {
    id: 'collection.info.mentions',
    defaultMessage: 'Mentions',
  },
  mentions_description: {
    id: 'collection.info.mentions_description',
    defaultMessage: 'Aleph automatically extracts terms that resemble names, address, phone numbers, and email addresses from uploaded documents and entities within your investigation. {br}{br} Click on a mentioned term below to find where it appears in your investigation.',
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
  xref: 'comparison',
  diagrams: 'graph',
  mappings: 'new-object',
  search: 'search',
  lists: 'list',
  timelines: 'gantt-chart',
  mentions: 'tag',
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

const CollectionViewLink = ({ id, collection, hash, search, children, ...rest }) => {
  const content = children || <CollectionViewLabel id={id} {...rest} />
  return (
    <Link to={getCollectionLink({ collection, mode: id, hash, search })}>
      {content}
    </Link>
  );
}

const CollectionViewCount = ({ id, collection, model, xrefResult }) => {
  let count;
  switch (id) {
    case 'documents':
    case 'entities':
      const schemaCounts = collection?.statistics?.schema?.values;
      if (schemaCounts) {
        count = 0;
        Object.entries(schemaCounts).forEach(([key, value]) => {
          const schema = model.getSchema(key);
          if ((id === 'entities' && !schema.isDocument()) || (id === 'documents' && schema.isDocument())) {
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
    case 'timelines':
      count = collection?.counts?.entitysets?.timeline;
      break;
    default:
      return null;
  }

  if (Number.isInteger(count)) {
    return <Count count={count} />;
  }
  return <Count isPending={collection.isPending} count={0} />;
}

class CollectionViewDescription extends PureComponent {
  render() {
    const { id, intl } = this.props;
    if (!id) { return null; }
    const messageKey = messages[`${id}_description`];
    if (!messageKey) { return null; }

    return (
      <span>{intl.formatMessage(messageKey, { br: <br /> })}</span>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId, location } = ownProps;
  const xrefQuery = collectionXrefFacetsQuery(location, collectionId);

  return ({
    model: selectModel(state),
    xrefResult: selectCollectionXrefResult(state, xrefQuery),
    collection: selectCollection(state, collectionId)
  });
};

export default class CollectionView {
  static Icon = CollectionViewIcon;
  static Label = injectIntl(CollectionViewLabel);
  static Link = injectIntl(CollectionViewLink);
  static Count = compose(withRouter, connect(mapStateToProps))(CollectionViewCount);
  static Description = injectIntl(CollectionViewDescription);
}
