import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router";
import {defineMessages, injectIntl} from 'react-intl';
import {Menu, MenuItem, MenuDivider, Popover, Button, Position, Icon} from "@blueprintjs/core";

import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import { DualPane, ScreenLoading, Collection } from 'src/components/common';
import { getColor } from "src/util/colorScheme";
import { selectCollectionsResult } from "src/selectors";

import './CaseInfo.css';
import Query from "../../app/Query";
import { queryCollections } from "../../actions";

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
    this.state = {
      home: true,
      timeline: false,
      documents: false,
      notes: false,
      settings: false,
      access: false
    };

    this.onChangeCase = this.onChangeCase.bind(this);
    this.onClickHome = this.onClickHome.bind(this);
    this.onClickTimeline = this.onClickTimeline.bind(this);
    this.onClickDocuments = this.onClickDocuments.bind(this);
    this.onClickNotes = this.onClickNotes.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
  }

  onChangeCase(casefile){
    const {history} = this.props;
    history.push({
      pathname: '/cases/' + casefile.id,
    });
  }

  onClickHome() {
    this.setState({home: true, timeline: false, documents: false, notes: false})
  }

  onClickTimeline() {
    this.setState({home: false, timeline: true, documents: false, notes: false})
  }

  onClickDocuments() {
    this.setState({home: false, timeline: false, documents: true, notes: false})
  }

  onClickNotes() {
    this.setState({home: false, timeline: false, documents: false, notes: true})
  }

  toggleSettings() {
    this.setState({home: false, timeline: false, documents: false, notes: false, settings: !this.state.settings, access: false})
  }

  toggleAccess() {
    this.setState({home: false, timeline: false, documents: false, notes: false, settings: false, access: !this.state.access})
  }

  render() {
    const { collection, result, intl } = this.props;
    const { home, timeline, documents, notes, settings, access } = this.state;
    const color = getColor(collection.id);
    const onChange = this.onChangeCase;

    return (
      <DualPane.InfoPane className="CaseInfo with-heading">
        <Menu className='pt-large' large={true}>
          <Popover content={<Menu>
            {result.results.map(function (file, index) {
              if (file.id !== collection.id) {
                return <MenuItem onClick={(e) => onChange(file)} key={index} text={file.label} />
              }
            })}
          </Menu>} className='case-file-dropdown' icon='search' text='Case' position={Position.LEFT_TOP}>
            <Button icon={<Icon icon='square' iconSize={Icon.SIZE_LARGE} color={color} style={{backgroundColor: color, opacity: 0.6}}/>}
                    rightIcon="menu-open" className='pt-fill pt-align-left' text={collection.label} />
          </Popover>
          <MenuDivider/>
          <MenuItem active={home} onClick={this.onClickHome} className='menu-item-padding' icon='home' text={intl.formatMessage(messages.home)}/>
          <MenuItem active={timeline} onClick={this.onClickTimeline} className='menu-item-padding' icon='timeline-events' text={intl.formatMessage(messages.timeline)}/>
          <MenuItem active={documents} onClick={this.onClickDocuments} className='menu-item-padding' icon='folder-close' text={intl.formatMessage(messages.documents)}/>
          <MenuItem active={notes} onClick={this.onClickNotes} className='menu-item-padding' icon='annotation' text={intl.formatMessage(messages.notes)}/>
          <MenuDivider/>
          <MenuItem active={settings} onClick={this.toggleSettings} className='menu-item-padding' text='Settings' icon='cog' />
          <MenuItem active={access} onClick={this.toggleAccess} className='menu-item-padding' text='Access' icon='key' />
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

CaseInfo = withRouter(CaseInfo);
CaseInfo = injectIntl(CaseInfo);
CaseInfo = connect(mapStateToProps, {queryCollections})(CaseInfo);
export default ({ match, ...otherProps }) => (
  <Collection.Load
    id={match.params.collectionId}
    renderWhenLoading={<ScreenLoading />}
  >{collection => (
    <CaseInfo collection={collection} {...otherProps} />
  )}</Collection.Load>
);
