import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router';
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
import { CollectionMode } from 'components/Collection/collectionModes';

import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { Breadcrumbs, Collection, Count, Schema, DualPane, ResultText, ResultCount, Summary } from 'components/common';
import { queryCollectionEntities } from 'queries';

import './InvestigationWrapper.scss';

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
    const { activeMode } = this.props;
    const ref = this.sidebarRef.current.getBoundingClientRect().y;
    if (!!activeMode && ref < 0) {
      this.setState({ sidebarFixed: true });
    } else {
      this.setState({ sidebarFixed: false });
    }
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
    const { activeMode, activeSearch, activeType, activeTypeCount, collection, intl, isCollapsed, query, result } = this.props;
    const { sidebarFixed } = this.state;
    const showBreadcrumbs = !!activeMode;
    const isSearch = activeMode === 'search';

    console.log('in breadcrumbs', activeSearch, result, query, query.hasQuery(), activeTypeCount);

    const breadcrumbs = (
      <Breadcrumbs>
        {isCollapsed && <Breadcrumbs.Collection key="collection" collection={collection} />}
        {activeMode && (isSearch || !activeType) && (
          <Breadcrumbs.Text active>
            <CollectionMode.Label id={activeMode} icon />
            <CollectionMode.Count id={activeMode} collection={collection} />
          </Breadcrumbs.Text>
        )}
        {(!isSearch && !!activeType) && (
          <Breadcrumbs.Text active>
            <Schema.Label schema={activeType} plural icon />
            <Count count={activeTypeCount} />
          </Breadcrumbs.Text>
        )}
        {query.hasQuery() && (
          <Breadcrumbs.Text active>
            <ResultText result={result} />
          </Breadcrumbs.Text>
        )}
      </Breadcrumbs>
    );

    let title, subheading;
    if (activeMode === 'search') {
      title = null;
    } else if (!!activeType) {
      title = <Schema.Label schema={activeType} plural icon />;
      subheading = <Schema.Description schema={activeType} />
    } else if (!!activeMode) {
      title = <CollectionMode.Label id={activeMode} icon />;
    }

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
                minimalHeader={sidebarFixed}
              />
            </div>
          </div>
          <DualPane.ContentPane className="InvestigationWrapper__body">
            <div className="InvestigationWrapper__body-content">
              {!!title && (
                <div className="InvestigationWrapper__title-container">
                  <h5 className="InvestigationWrapper__title">
                    <span>{title}</span>
                  </h5>
                  {subheading && <p className="InvestigationWrapper__subheading">{subheading}</p>}
                </div>
              )}
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
  const activeTypeCount = activeType && collection?.statistics?.schema?.values?.[activeType];
  return { isCollapsed, query, result, activeTypeCount };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
)(InvestigationWrapper);
