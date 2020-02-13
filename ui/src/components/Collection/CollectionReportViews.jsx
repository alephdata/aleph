import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import { selectModel } from 'src/selectors';
import CollectionReportMode from './CollectionReportMode';
import CollectionDocumentsReportMode from './CollectionDocumentsReportMode';

import './CollectionReportViews.scss';

/* eslint-disable */
class CollectionReportViews extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabChange = this.handleTabChange.bind(this);
  }

  handleTabChange(type) {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);
    parsedHash.type = type;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { collection, activeType, onChange } = this.props;

    const selectedTab = activeType;
    return (
      <Tabs
        id="CollectionReportTabs"
        className="CollectionReportViews__tabs info-tabs-padding"
        onChange={this.handleTabChange}
        selectedTabId={selectedTab}
        renderActiveTabPanelOnly
        animate={false}
        vertical
      >
        <Tab
          id="Overview"
          className="CollectionReportViews__tab"
          title={
            <>
              <Icon icon="heat-grid" className="left-icon" />
              <FormattedMessage
                id="report.info.overview"
                defaultMessage="Jobs overview"
              />
            </>
          }
          panel={<CollectionReportMode collection={collection} />}
        />
        <Tab
          id="Reports"
          className="CollectionReportViews__tab"
          title={
            <>
              <Icon icon="stacked-chart" className="left-icon" />
              <FormattedMessage
                id="report.info.documents"
                defaultMessage="Document reports"
              />
            </>
          }
          panel={<CollectionDocumentsReportMode collection={collection} />}
        />
      </Tabs>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection, location } = ownProps;
  const hashQuery = queryString.parse(location.hash);

  return {
    model: selectModel(state),
    activeType: hashQuery.type,
  };
};

CollectionReportViews = connect(mapStateToProps, {})(CollectionReportViews);
CollectionReportViews = injectIntl(CollectionReportViews);
CollectionReportViews = withRouter(CollectionReportViews);
export default CollectionReportViews;
