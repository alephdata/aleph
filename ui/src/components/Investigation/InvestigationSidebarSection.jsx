import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Alignment, Classes, ButtonGroup, Button, Divider, Tooltip } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import { Count, ResultCount, SchemaCounts } from 'components/common';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';

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
  documents: {
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
      collection, activeMode, activeType, diagrams, lists, xref, isCollapsed = false, toggleCollapsed,
      intl, schemaCounts
    } = this.props;

    const entityTools = [
      {
        id: collectionViewIds.DIAGRAMS,
        icon: 'graph',
        rightIcon: <ResultCount result={diagrams} />
      },
      {
        id: collectionViewIds.LISTS,
        icon: 'list',
        rightIcon: <ResultCount result={lists} />
      },
    ];
    const docTools = [
      {
        id: collectionViewIds.DOCUMENTS,
        icon: 'folder-open',
      },
      {
        id: collectionViewIds.MAPPINGS,
        icon: 'new-object',
      },
      {
        id: collectionViewIds.MENTIONS,
        icon: 'tag',
      },
    ];

    // <Button
    //   minimal
    //   icon={isCollapsed ? 'chevron-right' : 'chevron-left'}
    //   onClick={toggleCollapsed}
    //   className="InvestigationSidebar__collapse-toggle"
    // />

    return (
      <div className={c('InvestigationSidebar', {collapsed: isCollapsed})}>
        <div className="InvestigationSidebar__heading">
          <CollectionHeading collection={collection} showDescription />
        </div>
        <div className="InvestigationSidebar__section">
          <h6 className="bp3-heading InvestigationSidebar__section__title">
            <FormattedMessage id="collection.info.entities" defaultMessage="Entities" />
          </h6>
          <ButtonGroup vertical minimal fill className="InvestigationSidebar__section__menu">
            <SchemaCounts
              filterSchemata={schema => !schema.isDocument()}
              schemaCounts={schemaCounts}
              onSelect={schema => this.navigate(collectionViewIds.ENTITIES, schema)}
              showSchemaAdd={collection.writeable}
              activeSchema={activeType}
              isCollapsed={isCollapsed}
            />
            {entityTools.map(({ id, icon, rightIcon }) => (
              <Tooltip disabled={!isCollapsed} content={intl.formatMessage(messages[id])} position="right">
                <Button
                  key={id}
                  fill
                  icon={icon}
                  text={!isCollapsed && intl.formatMessage(messages[id])}
                  onClick={() => this.navigate(id)}
                  rightIcon={!isCollapsed && rightIcon}
                  active={activeMode === id}
                  alignText={Alignment.LEFT}
                  className="InvestigationSidebar__section__menu__item"
                />
              </Tooltip>
            ))}
          </ButtonGroup>
        </div>
        <div className="InvestigationSidebar__section">
          <h6 className="bp3-heading InvestigationSidebar__section__title">
            <FormattedMessage id="collection.info.documents" defaultMessage="Documents" />
          </h6>
          <ButtonGroup vertical minimal fill className="InvestigationSidebar__section__menu">
            <SchemaCounts
              filterSchemata={schema => schema.isDocument()}
              schemaCounts={schemaCounts}
              onSelect={schema => this.navigate(collectionViewIds.ENTITIES, schema)}
              showSchemaAdd={false}
              activeSchema={activeType}
              isCollapsed={isCollapsed}
            />
            {docTools.map(({ id, icon, rightIcon }) => (
              <Tooltip disabled={!isCollapsed} content={intl.formatMessage(messages[id])} position="right">
                <Button
                  key={id}
                  icon={icon}
                  text={!isCollapsed && intl.formatMessage(messages[id])}
                  onClick={() => this.navigate(id)}
                  rightIcon={!isCollapsed && rightIcon}
                  active={activeMode === id}
                  alignText={Alignment.LEFT}
                  className="InvestigationSidebar__section__menu__item"
                />
              </Tooltip>
            ))}
          </ButtonGroup>
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
