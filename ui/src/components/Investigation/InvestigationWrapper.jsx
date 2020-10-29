import React from 'react';
import { connect } from 'react-redux';

import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Tabs, Tab, Icon } from '@blueprintjs/core';
import queryString from 'query-string';

import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'


// import './InvestigationWrapper.scss';

class InvestigationWrapper extends React.Component {
  render() {
    const { collection } = this.props;

    return (
      <div className="InvestigationWrapper">
        <div className="InvestigationWrapper__inner-container">
          <div className="InvestigationWrapper__sidebar">
            <InvestigationSidebar
              collection={collection}
            />
          </div>
          <div className="InvestigationWrapper__body">
            {this.props.children}
          </div>
        </div>
      </div>
    );
  }
}

export default InvestigationWrapper;
