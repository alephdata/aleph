import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Drawer, Position } from '@blueprintjs/core';
import queryString from 'query-string';

import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { Breadcrumbs, SinglePane } from 'components/common';


import './InvestigationWrapper.scss';

class InvestigationWrapper extends React.Component {
  constructor(props) {
    super(props);

    this.state = { isCollapsed: false };
  }

  toggleCollapsed = () => {
    this.setState(({ isCollapsed }) => ({ isCollapsed: !isCollapsed }));
  }

  render() {
    const { collection } = this.props;
    const { isCollapsed } = this.state;

    const operation = (
      <CollectionManageMenu collection={collection} />
    );

    // <Drawer
    //   isOpen={isOpen}
    //   position={Position.LEFT}
    //   size={Drawer.SIZE_SMALL}
    //   hasBackdrop={false}
    //   usePortal={false}
    //   className="InvestigationWrapper__sidebar"
    // >

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={collection} active />
      </Breadcrumbs>
    );

    return (
      <div className="InvestigationWrapper">
        <div className="InvestigationWrapper__inner-container">
          <div className="InvestigationWrapper__sidebar">
            <InvestigationSidebar
              collection={collection}
              isCollapsed={isCollapsed}
              toggleCollapsed={this.toggleCollapsed}
            />
          </div>
          <div className="InvestigationWrapper__body">
            <SinglePane>
              {this.props.children}
            </SinglePane>
          </div>
        </div>
      </div>
    );
  }
}

export default InvestigationWrapper;
