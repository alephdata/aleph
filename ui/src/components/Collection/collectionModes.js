import React, { PureComponent } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Icon, Intent } from '@blueprintjs/core';
import { defineMessages, injectIntl } from 'react-intl';

import { queryCollectionDiagrams, queryCollectionDocuments, queryCollectionLists, queryCollectionXrefFacets, queryCollectionMappings } from 'queries';
import { selectEntitiesResult, selectEntitySetsResult, selectCollectionXrefResult, selectMappingsResult } from 'selectors';

import { ResultCount } from 'components/common';

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
    defaultMessage: 'Browse documents',
  },
  mappings: {
    id: 'collection.info.mappings',
    defaultMessage: 'Mappings',
  },
  mentions: {
    id: 'collection.info.mentions',
    defaultMessage: 'Mentions',
  },
});

const collectionModes = {
  documents: {
    icon: 'folder-open',
    category: 'docTool',
    query: queryCollectionDocuments,
    result: selectEntitiesResult
  },
  entities: {
    collapsed: true,
  },
  search: {
    icon: 'search',
    collapsed: true
  },
  xref: {
    icon: 'comparison',
    collapsed: true,
    category: 'entityTool',
    query: queryCollectionXrefFacets,
    result: selectCollectionXrefResult
  },
  diagrams: {
    icon: 'graph',
    category: 'entityTool',
    query: queryCollectionDiagrams,
    result: selectEntitySetsResult,
  },
  lists: {
    icon: 'list',
    category: 'entityTool',
    query: queryCollectionLists,
    result: selectEntitySetsResult,
  },
  mappings: {
    icon: 'new-object',
    category: 'docTool',
    query: queryCollectionMappings,
    result: selectMappingsResult,
  },
  mentions: {
    icon: 'tag',
    category: 'docTool'
  },
}

const getModesByCategory = (filterCategory) => {
  return Object.entries(collectionModes)
    .filter(([key,{category}]) => filterCategory === category)
    .map(entry => entry[0]);
}

const CollectionModeIcon = ({ id, className }) => {
  const icon = collectionModes[id]?.icon;
  if (!icon) { return null; }
  return <Icon icon={icon} className={className} />
}

class CollectionModeLabel extends PureComponent {
  render() {
    const { icon, id, intl } = this.props;
    if (!id) { return null; }
    const messageKey = messages[id];
    if (!messageKey) { return null; }

    return (
      <>
        {icon && <CollectionModeIcon id={id} className="left-icon" />}
        <span>{intl.formatMessage(messageKey)}</span>
      </>
    );
  }
}

class CollectionModeCount extends PureComponent {
  // componentDidMount() {
  //   this.fetchIfNeeded();
  // }
  //
  // componentDidUpdate() {
  //   this.fetchIfNeeded();
  // }
  //
  // fetchIfNeeded() {
  //   const { query, result } = this.props;
  //   if (result.shouldLoad) {
  //     this.props.queryEntities({ query });
  //   }
  // }

  render() {
    const { result } = this.props;
    if (!result) { return null; }

    return <ResultCount result={result} intent={Intent.PRIMARY} />
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location, id } = ownProps;

  const collectionMode = collectionModes[id];
  if (collectionMode && collectionMode.query) {
    const query = collectionMode.query(location, collection.id);
    return { result: collectionMode.result(state, query) };
  }
  return {};
};

class CollectionMode {
  static Icon = CollectionModeIcon;
  static Label = injectIntl(CollectionModeLabel);
  static Count = compose(
    withRouter,
    connect(mapStateToProps),
  )(CollectionModeCount);
  // static Link = withRouter(CollectionLink);
}

export { CollectionMode, collectionModes, getModesByCategory };
