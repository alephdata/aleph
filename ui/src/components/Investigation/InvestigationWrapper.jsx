import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';
import { Drawer, Position } from '@blueprintjs/core';
import queryString from 'query-string';

import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import InvestigationSidebar from 'src/components/Investigation/InvestigationSidebar'
import { Breadcrumbs, Schema, SinglePane } from 'components/common';
import collectionViewIds from 'components/Collection/collectionViewIds';



import './InvestigationWrapper.scss';

const collapsedModes = [collectionViewIds.ENTITIES];

const messages = defineMessages({
  overview: {
    id: 'collection.info.overview',
    defaultMessage: 'Overview',
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
      console.log('mode changed', collapsedModes.indexOf(nextMode) >= 0, nextMode);
      return ({ isCollapsed: collapsedModes.indexOf(nextMode) >= 0, prevMode: nextMode })
    }
    return prevState;
  }

  toggleCollapsed = () => {
    this.setState(({ isCollapsed }) => ({ isCollapsed: !isCollapsed }));
  }

  render() {
    const { activeMode, activeType, collection, intl } = this.props;
    const { isCollapsed } = this.state;

    const operation = (
      <CollectionManageMenu collection={collection} />
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        {isCollapsed && <Breadcrumbs.Collection key="collection" collection={collection} />}
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
      </Breadcrumbs>
    );

    return (
      <div className="InvestigationWrapper">
        {isCollapsed && breadcrumbs}
        <div className="InvestigationWrapper__inner-container">
          <div className="InvestigationWrapper__sidebar">
            <InvestigationSidebar
              collection={collection}
              isCollapsed={isCollapsed}
              toggleCollapsed={this.toggleCollapsed}
            />
          </div>
          <div className="InvestigationWrapper__body">
            {!isCollapsed && breadcrumbs}
            <SinglePane>
              {this.props.children}
            </SinglePane>
          </div>
        </div>
      </div>
    );
  }
}

export default injectIntl(InvestigationWrapper);
