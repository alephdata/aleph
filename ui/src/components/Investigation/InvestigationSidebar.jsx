import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Card, Classes, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, ResultCount, SchemaCounts } from 'components/common';
import CollectionHeading from 'components/Collection/CollectionHeading';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { queryCollectionEntitySets, queryCollectionXrefFacets } from 'queries';
import { selectModel, selectEntitySetsResult, selectCollectionXrefResult } from 'selectors';

import './InvestigationSidebar.scss';

const messages = defineMessages({
  diagrams: {
    id: 'collection.info.diagrams',
    defaultMessage: 'Network diagrams',
  },
  lists: {
    id: 'collection.info.lists',
    defaultMessage: 'Lists',
  },
  browse: {
    id: 'collection.info.browse',
    defaultMessage: 'Browse folders',
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

class InvestigationSidebar extends React.Component {
  constructor(props) {
    super(props);
    this.navigate = this.navigate.bind(this);
  }

  componentDidUpdate() {
    const { activeMode } = this.props;
    if (Object.values(collectionViewIds).indexOf(activeMode) < 0) {
      this.navigate(collectionViewIds.OVERVIEW);
    }
  }

  navigate(mode, type) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = mode;
    parsedHash.type = type
    // delete parsedHash.type;

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode, activeType, diagrams, lists, xref,
      intl, schemaCounts
    } = this.props;

    return (
      <div className="InvestigationSidebar">
        <CollectionHeading collection={collection} showDescription />

        <div className="InvestigationSidebar__section">
          <Menu>
            <li className="bp3-menu-header">
              <h6 className="bp3-heading">
                <FormattedMessage id="collection.info.entities" defaultMessage="Entities" />
              </h6>
            </li>
            <SchemaCounts
              filterSchemata={schema => !schema.isDocument()}
              schemaCounts={schemaCounts}
              onSelect={schema => this.navigate(collectionViewIds.ENTITIES, schema)}
              showSchemaAdd={collection.writeable}
              activeSchema={activeType}
            />
            <MenuItem
              icon="graph"
              text={intl.formatMessage(messages.diagrams)}
              onClick={() => this.navigate(collectionViewIds.DIAGRAMS)}
              labelElement={<ResultCount result={diagrams} />}
              active={activeMode === collectionViewIds.DIAGRAMS}
            />
            <MenuItem
              icon="list"
              text={intl.formatMessage(messages.lists)}
              onClick={() => this.navigate(collectionViewIds.LISTS)}
              labelElement={<ResultCount result={lists} />}
              active={activeMode === collectionViewIds.LISTS}
            />
          </Menu>
        </div>
        <div className="InvestigationSidebar__section">
          <Menu>
            <li className="bp3-menu-header">
              <h6 className="bp3-heading">
                <FormattedMessage id="collection.info.documents" defaultMessage="Documents" />
              </h6>
            </li>
            <SchemaCounts
              filterSchemata={schema => schema.isDocument()}
              schemaCounts={schemaCounts}
              onSelect={schema => this.navigate(collectionViewIds.ENTITIES, schema)}
              showSchemaAdd={false}
              activeSchema={activeType}
            />
            <MenuItem
              icon="folder-open"
              text={intl.formatMessage(messages.browse)}
              onClick={() => this.navigate(collectionViewIds.DOCUMENTS)}
              active={activeMode === collectionViewIds.DOCUMENTS}
            />
            <MenuItem
              icon="new-object"
              text={intl.formatMessage(messages.mappings)}
              onClick={() => this.navigate()}
              active={activeMode === ''}
            />
            <MenuItem
              icon="tag"
              text={intl.formatMessage(messages.mentions)}
              onClick={() => this.navigate()}
              active={activeMode === ''}
            />
          </Menu>

        </div>
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const model = selectModel(state);
  const diagramsQuery = queryCollectionEntitySets(location, collection.id).setFilter('type', 'diagram');
  const listsQuery = queryCollectionEntitySets(location, collection.id).setFilter('type', 'list');
  const xrefQuery = queryCollectionXrefFacets(location, collection.id);
  const hashQuery = queryString.parse(location.hash);

  return {
    schemaCounts: collection?.statistics?.schema?.values || {},
    xref: selectCollectionXrefResult(state, xrefQuery),
    diagrams: selectEntitySetsResult(state, diagramsQuery),
    lists: selectEntitySetsResult(state, listsQuery),
    activeMode: hashQuery.mode,
    activeType: hashQuery.type,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationSidebar);
