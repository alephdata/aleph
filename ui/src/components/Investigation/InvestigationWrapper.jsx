import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Button, Drawer, Intent, Position } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import Query from 'app/Query';
import { selectEntitiesResult } from 'selectors';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionInfo from 'components/Collection/CollectionInfo';
import CollectionStatus from 'components/Collection/CollectionStatus';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionReference from 'components/Collection/CollectionReference';

import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { Breadcrumbs, Collection, Schema, DualPane, ResultText, ResultCount, Summary } from 'components/common';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { queryCollectionEntities } from 'queries';

import './InvestigationWrapper.scss';

const messages = defineMessages({
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


class InvestigationWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = { sidebarFixed: false };

    this.sidebarRef = React.createRef();

    this.onScroll = this.onScroll.bind(this);
    this.toggleCollapsed = this.toggleCollapsed.bind(this);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.onScroll)
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.onScroll)
  }

  onScroll() {
    console.log('scrolling wrapper');
    const ref = this.sidebarRef.current.getBoundingClientRect().y;
    console.log('ref is', ref);
    if (ref < 0) {
      this.setState({ sidebarFixed: true });
    } else {
      this.setState({ sidebarFixed: false });
    }
    // console.log(ref.pageYOffset, ref.offsetTop)

  }

  toggleCollapsed = () => {
    const { history, isCollapsed, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    if (!isCollapsed) {
      parsedHash.collapsed = true;
    } else {
      delete parsedHash.collapsed;
    }
    history.push({
      pathname: location.pathname,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { activeMode, activeSearch, activeType, collection, intl, isCollapsed, result } = this.props;
    const { sidebarFixed } = this.state;
    const showBreadcrumbs = !!activeMode;

    // const operation = (
    //   <CollectionManageMenu collection={collection} />
    // );
    // <ResultCount result={result} className="bp3-intent-primary" />

    const breadcrumbs = (
      <Breadcrumbs>
        {isCollapsed && <Breadcrumbs.Collection key="collection" collection={collection} />}
        {activeMode && !activeType && (
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
        {isCollapsed && breadcrumbs}

        <DualPane>
          <div ref={this.sidebarRef} className={c("InvestigationWrapper__sidebar-placeholder", { fixed: sidebarFixed, collapsed: isCollapsed })}>
            <div className="InvestigationWrapper__sidebar-container">
              <InvestigationSidebar
                collection={collection}
                isCollapsed={isCollapsed}
                toggleCollapsed={this.toggleCollapsed}
                onSearch={this.props.onSearch}
              />
            </div>
          </div>
          <DualPane.ContentPane className="InvestigationWrapper__body">
            {!isCollapsed && showBreadcrumbs && breadcrumbs}
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
  const hashQuery = queryString.parse(location.hash);
  const query = queryCollectionEntities(location, collection.id, activeType);
  const result = selectEntitiesResult(state, query);
  const isCollapsed = hashQuery.collapsed;
  return { isCollapsed, query, result };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(InvestigationWrapper);
