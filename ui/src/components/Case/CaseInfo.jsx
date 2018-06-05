import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import { defineMessages, injectIntl } from 'react-intl';
import { Menu, MenuItem, MenuDivider, Popover, Button, Position, Icon } from "@blueprintjs/core";

import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import { DualPane } from 'src/components/common';
import { getColor } from "src/util/colorScheme";
import { selectCollectionsResult } from "src/selectors";
import Query from "src/app/Query";

import { queryCollections } from "src/actions";

import './CaseInfo.css';

const messages = defineMessages({
  home: {
    id: 'case.context.home',
    defaultMessage: 'Home'
  },
  settings: {
    id: 'case.context.settings',
    defaultMessage: 'Settings'
  },
  access: {
    id: 'case.context.access',
    defaultMessage: 'Access'
  },
  documents: {
    id: 'case.context.documents',
    defaultMessage: 'Documents'
  }
});

class CaseInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isSettingsOpen: false,
      isAccessOpen: false,
    };

    this.toggleAccess = this.toggleAccess.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
  }

  toggleSettings() {
    this.setState({isSettingsOpen: !this.state.isSettingsOpen});
  }

  toggleAccess() {
    this.setState({isAccessOpen: !this.state.isAccessOpen});
  }

  render() {
    const {collection, result, activeTab, intl} = this.props;
    const color = getColor(collection.id);
    const collections = result.results.filter((coll) => coll.id !== collection.id);

    return (
      <DualPane.InfoPane className="CaseInfo with-heading">
        <Menu className='pt-large' large={true}>
          <Popover content={<Menu>
            {collections.map(function (file, index) {
              return <Link key={index} to={'/cases/' + file.id} className="pt-menu-item">
                <div className="pt-text-overflow-ellipsis pt-fill">
                  {file.label}
                </div>
              </Link>
            })}
          </Menu>} className='case-file-dropdown' icon='search' text='Case' position={Position.BOTTOM_RIGHT}>
            <Button icon={<Icon icon='square' iconSize={Icon.SIZE_LARGE} color={color}
                                style={{backgroundColor: color, opacity: 0.6}}/>}
                    rightIcon="menu-open"
                    className='pt-fill pt-align-left'
                    text={collection.label}/>
          </Popover>
          <MenuDivider/>
          <MenuItem key={0}
                    active={'Home' === activeTab}
                    className='menu-item-padding'
                    icon="home"
                    text={intl.formatMessage(messages.home)}
                    href={'/cases/' + collection.id} />
          <MenuItem key={1}
                    active={'Documents' === activeTab}
                    className='menu-item-padding'
                    icon="folder-close"
                    text={intl.formatMessage(messages.documents)}
                    href={'/cases/' + collection.id + '/documents'} />
          <MenuDivider/>
          <MenuItem onClick={this.toggleSettings}
                    className='menu-item-padding'
                    text={intl.formatMessage(messages.settings)}
                    icon='cog'/>
          <MenuItem onClick={this.toggleAccess}
                    className='menu-item-padding'
                    text={intl.formatMessage(messages.access)}
                    icon='key'/>
        </Menu>
        <CollectionAccessDialog
          collection={collection}
          isOpen={this.state.isAccessOpen}
          toggleDialog={this.toggleAccess}
        />
        <CollectionEditDialog
          collection={collection}
          isOpen={this.state.isSettingsOpen}
          toggleDialog={this.toggleSettings}
        />
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
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
