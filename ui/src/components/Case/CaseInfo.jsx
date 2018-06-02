import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import { defineMessages, injectIntl } from 'react-intl';
import { Menu, MenuItem, MenuDivider, Popover, Button, Position, Icon } from "@blueprintjs/core";

import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import { DualPane, ScreenLoading } from 'src/components/common';
import { getColor } from "src/util/colorScheme";
import { selectCollectionsResult } from "src/selectors";
import Query from "src/app/Query";

import { queryCollections } from "src/actions";

import './CaseInfo.css';

const messages = defineMessages({
  home: {
    id: 'case.info.home',
    defaultMessage: 'Home'
  },
  timeline: {
    id: 'case.info.timeline',
    defaultMessage: 'Timeline'
  },
  documents: {
    id: 'case.info.documents',
    defaultMessage: 'Documents'
  },
  notes: {
    id: 'case.info.notes',
    defaultMessage: 'Notes'
  },
});

class CaseInfo extends Component {
  constructor(props) {
    super(props);
    const {intl} = this.props;

    this.state = {
      settings: false,
      access: false,
      tabItems: [
        {
          index: 0,
          name: 'Home',
          icon: 'home',
          text: intl.formatMessage(messages.home),
          url: ''
        }, {
          index: 1,
          name: 'Documents',
          icon: 'folder-close',
          text: intl.formatMessage(messages.documents),
          url: '/documents'
        },
      ]
    };

    this.toggleAccess = this.toggleAccess.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.onClickTab = this.onClickTab.bind(this);
  }

  onClickTab(collectionId, url) {
    const {history} = this.props;
    history.push({
      pathname: '/cases/' + collectionId + url
    });
  }

  toggleSettings() {
    this.setState({settings: !this.state.settings});
  }

  toggleAccess() {
    this.setState({access: !this.state.access});
  }

  render() {
    const {collection, result, activeTab} = this.props;
    const {settings, access, tabItems} = this.state;
    const color = getColor(collection.id);

    return (
      <DualPane.InfoPane className="CaseInfo with-heading">
        <Menu className='pt-large' large={true}>
          <Popover content={<Menu>
            {result.results.map(function (file, index) {
              if (file.id !== collection.id) {
                return <Link key={index} to={'/cases/' + file.id} className="pt-menu-item">
                  <div className="pt-text-overflow-ellipsis pt-fill">
                    {file.label}
                  </div>
                </Link>
              }
            })}
          </Menu>} className='case-file-dropdown' icon='search' text='Case' position={Position.BOTTOM_RIGHT}>
            <Button icon={<Icon icon='square' iconSize={Icon.SIZE_LARGE} color={color}
                                style={{backgroundColor: color, opacity: 0.6}}/>}
                    rightIcon="menu-open" className='pt-fill pt-align-left' text={collection.label}/>
          </Popover>
          <MenuDivider/>
          ﻿{tabItems.map((item, index) =>
          <MenuItem key={index} active={item.name === activeTab}
                    className='menu-item-padding' icon={item.icon} text={item.text} onClick={(e) => this.onClickTab(collection.id, item.url)}/>)
        }
          <MenuDivider/>
          <MenuItem active={settings} onClick={this.toggleSettings} className='menu-item-padding'
                    text='Settings' icon='cog'/>
          <MenuItem active={access} onClick={this.toggleAccess} className='menu-item-padding'
                    text='Access' icon='key'/>
        </Menu>
        <CollectionAccessDialog
          collection={collection}
          isOpen={access}
          toggleDialog={this.toggleAccess}
        />
        <CollectionEditDialog
          collection={collection}
          isOpen={settings}
          toggleDialog={this.toggleSettings}
        />
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {location} = ownProps;
  const context = {
    facet: [ 'category', 'countries' ],
    'filter:kind': 'casefile'
  };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .sortBy('count', true)
    .limit(30);

  return {
    query: query,
    result: selectCollectionsResult(state, query)
  };
};

CaseInfo = injectIntl(CaseInfo);
CaseInfo = connect(mapStateToProps, {queryCollections})(CaseInfo);
CaseInfo = withRouter(CaseInfo);
export default CaseInfo;
