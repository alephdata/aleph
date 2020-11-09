import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, Drawer, Intent, Position } from '@blueprintjs/core';
import queryString from 'query-string';

import Query from 'app/Query';
import { selectEntitiesResult } from 'selectors';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { Breadcrumbs, Collection, Schema, DualPane, ResultText } from 'components/common';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { queryCollectionEntities } from 'queries';

import './InvestigationWrapper.scss';

const collapsedModes = [collectionViewIds.ENTITIES, collectionViewIds.SEARCH];

const messages = defineMessages({
  overview: {
    id: 'collection.info.overview',
    defaultMessage: 'Overview',
  },
  search: {
    id: 'collection.info.search',
    defaultMessage: 'Search',
  },
  entities: {
    id: 'collection.info.entities',
    defaultMessage: 'Entities',
  },
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


class InvestigationWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = { isCollapsed: false };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const nextMode = nextProps.activeMode
    if (nextMode !== prevState.prevMode) {
      return ({ isCollapsed: collapsedModes.indexOf(nextMode) >= 0, prevMode: nextMode })
    }
    return prevState;
  }

  toggleCollapsed = () => {
    this.setState(({ isCollapsed }) => ({ isCollapsed: !isCollapsed }));
  }

  render() {
    const { activeMode, activeSearch, activeType, collection, intl, result } = this.props;
    const { isCollapsed } = this.state;

    // const operation = (
    //   <CollectionManageMenu collection={collection} />
    // );

    console.log(activeSearch)

    const breadcrumbs = (
      <Breadcrumbs>
        {!activeType && (
          <Breadcrumbs.Text active>
            {intl.formatMessage(messages[activeMode])}
          </Breadcrumbs.Text>
        )}
        {!!activeType && (
          <Breadcrumbs.Text active>
            <Schema.Label schema={activeType} plural icon />
          </Breadcrumbs.Text>
        )}
        {!_.isEmpty(activeSearch) && (
          <Breadcrumbs.Text active>
            <ResultText result={result} />
          </Breadcrumbs.Text>
        )}
      </Breadcrumbs>
    );

    return (
      <div className="InvestigationWrapper">
        {isCollapsed && (
          <div className="InvestigationWrapper__breadcrumbs-container">
            <Button
              minimal
              className="InvestigationWrapper__breadcrumbs-container__label"
              onClick={this.toggleCollapsed}
            >
              <Collection.Label collection={collection} />
            </Button>
            {breadcrumbs}
          </div>
        )}
        <DualPane>
          <div>
            <InvestigationSidebar
              collection={collection}
              isCollapsed={isCollapsed}
              toggleCollapsed={this.toggleCollapsed}
              onSearch={this.props.onSearch}
            />
          </div>
          <DualPane.ContentPane className="InvestigationWrapper__body">
            {!isCollapsed && breadcrumbs}
            <div className="InvestigationWrapper__body-content">
              {this.props.children}
            </div>
          </DualPane.ContentPane>
        </DualPane>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { activeType, collection, location } = ownProps;
  console.log('active type is', activeType)
  const query = queryCollectionEntities(location, collection.id, activeType);
  const result = selectEntitiesResult(state, query);
  return { query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationWrapper);
