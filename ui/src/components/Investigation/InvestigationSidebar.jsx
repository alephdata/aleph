import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Alignment, Classes, ButtonGroup, Button, Divider, Tooltip } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import { Count, ResultCount, SchemaCounts, SearchBox, Summary } from 'components/common';
import InvestigationHeading from 'components/Investigation/InvestigationHeading';
import InvestigationSidebarButton from 'components/Investigation/InvestigationSidebarButton';
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
  xref: {
    id: 'collection.info.xref',
    defaultMessage: 'Cross-reference',
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

const collapsedModes = [collectionViewIds.ENTITIES, collectionViewIds.SEARCH, collectionViewIds.XREF];


class InvestigationSidebar extends React.Component {
  constructor(props) {
    super(props);

    this.navigate = this.navigate.bind(this);
  }

  navigate(mode, type) {
    const { history, isCollapsed, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = mode;
    if (type) {
      parsedHash.type = type
    } else {
      delete parsedHash.type;
    }

    if (!isCollapsed && collapsedModes.indexOf(mode) > 0) {
      parsedHash.collapsed = true;
    }

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, activeMode, activeType, diagrams, lists, xref, isCollapsed, toggleCollapsed,
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
      {
        id: collectionViewIds.XREF,
        icon: 'comparison',
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

    return (
      <div className='InvestigationSidebar'>
        <div className="InvestigationSidebar__scroll-container">
          <InvestigationHeading collection={collection} activeMode={activeMode} />
          <div className="InvestigationSidebar__content">
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
                {entityTools.map(({ id, ...rest }) => (
                  <InvestigationSidebarButton
                    key={id}
                    text={intl.formatMessage(messages[id])}
                    onClick={() => this.navigate(id)}
                    active={activeMode === id}
                    isCollapsed={isCollapsed}
                    {...rest}
                  />
                ))}
              </ButtonGroup>
            </div>
            <div className="InvestigationSidebar__section">
              <h6 className="bp3-heading InvestigationSidebar__section__title">
                <FormattedMessage id="collection.info.documents" defaultMessage="Documents" />
              </h6>
              <ButtonGroup vertical minimal fill className="InvestigationSidebar__section__menu">
                {docTools.map(({ id, ...rest }) => (
                  <InvestigationSidebarButton
                    key={id}
                    text={intl.formatMessage(messages[id])}
                    onClick={() => this.navigate(id)}
                    active={activeMode === id}
                    isCollapsed={isCollapsed}
                    {...rest}
                  />
                ))}
              </ButtonGroup>
            </div>
          </div>
        </div>
        <div className="InvestigationSidebar__footer">
          <Button
            minimal
            fill
            icon={isCollapsed ? 'chevron-right' : 'chevron-left'}
            onClick={toggleCollapsed}
            text={isCollapsed ? null : 'Collapse'}
            className="InvestigationSidebar__collapse-toggle"
          />
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
