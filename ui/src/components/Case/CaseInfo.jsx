import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";
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
      activeTab: 0,
      settings: false,
      access: false,
      tabItems: [
        {
          index: 0,
          name: 'Home',
          icon: 'home',
          text: intl.formatMessage(messages.home),
        }, {
          index: 1,
          name: 'Timeline',
          icon: 'timeline-events',
          text: intl.formatMessage(messages.timeline)
        }, {
          index: 2,
          name: 'Documents',
          icon: 'folder-close',
          text: intl.formatMessage(messages.documents)
        }, {
          index: 3,
          name: 'Notes',
          icon: 'annotation',
          text: intl.formatMessage(messages.notes)
        }
      ]
    };

    this.onChangeCase = this.onChangeCase.bind(this);
    this.onClickTab = this.onClickTab.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
  }

  onChangeCase(casefile) {
    const {history} = this.props;
    history.push({
      pathname: '/cases/' + casefile.id,
    });
  }

  async componentDidMount() {
    await this.fetchIfNeeded();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.id !== this.props.id) {
      await this.fetchIfNeeded();
    }
  }

  async fetchIfNeeded() {
    const {query, result} = this.props;
    if (result.total === undefined && !result.isLoading && !result.isError) {
      this.props.queryCollections({query});
    }
  }

  onClickTab(index) {
    this.setState({activeTab: index});
  }

  toggleSettings() {
    this.setState({settings: !this.state.settings});
  }

  toggleAccess() {
    this.setState({access: !this.state.access});
  }

  render() {
    const {collection, result} = this.props;
    const {activeTab, settings, access, tabItems} = this.state;
    const color = getColor(collection.id);
    const onChange = this.onChangeCase;

    if (collection.isLoading) {
      return <ScreenLoading/>;
    }

    return (
      <DualPane.InfoPane className="CaseInfo with-heading">
        <Menu className='pt-large' large={true}>
          <Popover content={<Menu>
            {result.results.map(function (file, index) {
              if (file.id !== collection.id) {
                return <MenuItem onClick={(e) => onChange(file)} key={index} text={file.label}/>
              }
            })}
          </Menu>} className='case-file-dropdown' icon='search' text='Case' position={Position.RIGHT_TOP}>
            <Button icon={<Icon icon='square' iconSize={Icon.SIZE_LARGE} color={color}
                                style={{backgroundColor: color, opacity: 0.6}}/>}
                    rightIcon="menu-open" className='pt-fill pt-align-left' text={collection.label}/>
          </Popover>
          <MenuDivider/>
          ﻿{tabItems.map((item, index) =>
          <MenuItem key={index} active={item.index === activeTab} onClick={(e) => this.onClickTab(index)}
                    className='menu-item-padding' icon={item.icon} text={item.text}/>)
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
