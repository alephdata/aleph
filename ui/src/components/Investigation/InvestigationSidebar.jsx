import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Card, Classes, Menu, MenuItem, MenuDivider } from '@blueprintjs/core';
import queryString from 'query-string';

import { Count, ResultCount } from 'components/common';
import CollectionOverviewMode from 'components/Collection/CollectionOverviewMode';
import CollectionDocumentsMode from 'components/Collection/CollectionDocumentsMode';
import CollectionEntitiesMode from 'components/Collection/CollectionEntitiesMode';
import CollectionXrefMode from 'components/Collection/CollectionXrefMode';
import CollectionEntitySetsIndexMode from 'components/Collection/CollectionEntitySetsIndexMode';
import CollectionHeading from 'components/Collection/CollectionHeading';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { queryCollectionEntitySets, queryCollectionXrefFacets } from 'queries';
import { selectModel, selectEntitySetsResult, selectCollectionXrefResult } from 'selectors';

// import './InvestigationSidebar.scss';

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
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  componentDidUpdate() {
    const { activeMode } = this.props;
    if (Object.values(collectionViewIds).indexOf(activeMode) < 0) {
      this.handleTabChange(collectionViewIds.OVERVIEW);
    }
  }

  handleTabChange(mode) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = mode;
    delete parsedHash.type;

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode, diagrams, lists, xref,
      showDocumentsTab, intl,
      documentTabCount, entitiesTabCount
    } = this.props;

    return (
      <div className="InvestigationSidebar">
        <div className="InvestigationSidebar">
          <CollectionHeading collection={collection} showCategory={false} showDescription />

          <div className="InvestigationSidebar__section">
            <Menu>
              <li className="bp3-menu-header">
                <h6 className="bp3-heading">
                  <FormattedMessage id="collection.info.entities" defaultMessage="Entities" />
                </h6>
              </li>

              <MenuItem
                icon="graph"
                text={intl.formatMessage(messages.diagrams)}
                onClick={() => this.navigate('/')}
                rightIcon={<ResultCount result={diagrams} />}
                active={activeMode === 'diagrams'}
              />
              <MenuItem
                icon="list"
                text={intl.formatMessage(messages.lists)}
                onClick={() => this.navigate('/')}
                rightIcon={<ResultCount result={lists} />}
                active={activeMode === 'lists'}
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
              <MenuItem
                icon="folder-open"
                text={intl.formatMessage(messages.browse)}
                onClick={() => this.navigate('/')}
                active={activeMode === ''}
              />
              <MenuItem
                icon="new-object"
                text={intl.formatMessage(messages.mappings)}
                onClick={() => this.navigate('/')}
                active={activeMode === ''}
              />
              <MenuItem
                icon="tag"
                text={intl.formatMessage(messages.mentions)}
                onClick={() => this.navigate('/')}
                active={activeMode === ''}
              />
            </Menu>

          </div>
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
  const schemata = collection?.statistics?.schema?.values;
  let documentTabCount, entitiesTabCount;
  const hashQuery = queryString.parse(location.hash);

  if (schemata) {
    documentTabCount = 0;
    entitiesTabCount = 0;

    for (const key in schemata) {
      const schema = model.getSchema(key);
      if (schema.isDocument()) {
        documentTabCount += schemata[key];
      }
      if (!(schema.isDocument() || schema.hidden)) {
        entitiesTabCount += schemata[key];
      }
    }
  }

  return {
    entitiesTabCount: entitiesTabCount,
    documentTabCount: documentTabCount,
    showDocumentsTab: (documentTabCount > 0 || collection.writeable),
    xref: selectCollectionXrefResult(state, xrefQuery),
    diagrams: selectEntitySetsResult(state, diagramsQuery),
    lists: selectEntitySetsResult(state, listsQuery),
    activeMode: hashQuery.mode,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationSidebar);
