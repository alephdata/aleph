import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Tooltip, Position, Button, Tab, Tabs } from "@blueprintjs/core";

import { fetchCollectionXrefIndex } from 'src/actions';
import { selectCollectionXrefIndex } from 'src/selectors';
import { Toolbar, CloseButton } from 'src/components/Toolbar';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import { Collection, DualPane, TabCount, TextLoading } from 'src/components/common';
import { CollectionInfoXref, CollectionOverview, CollectionInfoContent } from 'src/components/Collection';


const messages = defineMessages({
  browse_tooltip: {
    id: 'collection.info.browse_tooltip',
    defaultMessage: 'Browse as a folder',
  }
});

class CollectionInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'overview',
      settingsIsOpen: false,
      accessIsOpen: false
    };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
  }
  
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collection, xrefIndex } = this.props;
    if (collection.id !== undefined && xrefIndex.results === undefined && !xrefIndex.isLoading) {
      this.props.fetchCollectionXrefIndex(collection);
    }
  }

  handleTabChange(activeTabId: TabId) {
    this.setState({activeTabId});
  }

  toggleSettings() {
    this.setState({ settingsIsOpen: !this.state.settingsIsOpen });
  }

  toggleAccess() {
    this.setState({ accessIsOpen: !this.state.accessIsOpen });
  }

  render() {
    const {collection, intl, showToolbar, xrefIndex} = this.props;
    const {activeTabId, settingsIsOpen, accessIsOpen} = this.state;

    // @TODO Discussion: 'Search Collection' link to update the current query?
    return (
      <DualPane.InfoPane className="CollectionInfo with-heading">
        {showToolbar && (
          <Toolbar className="toolbar-preview">
            <div className="pt-button-group">
              <Link to={`/search?filter:collection_id=${collection.id}`} className="pt-button button-link">
                <span className={`pt-icon-search`}/>
                <FormattedMessage id="collection.info.search_button" defaultMessage="Search"/>
              </Link>
              <Tooltip content={intl.formatMessage(messages.browse_tooltip)} position={Position.BOTTOM_RIGHT}>
                <Link to={`/collections/${collection.id}/documents`} className="pt-button button-link">
                  <span className={`pt-icon-folder-open`}/>
                  {/*
                    <FormattedMessage id="collection.info.browse_button" defaultMessage="Browse"/>
                  */}
                </Link>
              </Tooltip>
            </div>
            {collection.writeable &&
              <div className="pt-button-group">
                <Button icon="cog" onClick={this.toggleSettings}>
                  <FormattedMessage id="collection.info.edit_button" defaultMessage="Settings"/>
                </Button>
                <CollectionEditDialog
                  collection={collection}
                  isOpen={settingsIsOpen}
                  toggleDialog={this.toggleSettings}
                />
                <Button icon="key" onClick={this.toggleAccess} className='button-hover'>
                  <FormattedMessage id="collection.info.access" defaultMessage="Access"/>
                </Button>
                <CollectionAccessDialog
                  collection={collection}
                  isOpen={accessIsOpen}
                  toggleDialog={this.toggleAccess}
                />
              </div>
            }
            <CloseButton/>
          </Toolbar>
        )}
        <div className="pane-heading">
          <span>
            <Collection.Label collection={collection} label={false} />
            { collection.casefile && (
              <FormattedMessage id="collection.info.case" defaultMessage="Casefile"/>
            )}
            { !collection.casefile && (
              <FormattedMessage id="collection.info.source" defaultMessage="Source"/>
            )}
          </span>
          <h1>
            {collection.label}
          </h1>
        </div>
        <div className="pane-content">
          <Tabs id="CollectionInfoTabs" onChange={this.handleTabChange} selectedTabId={activeTabId}>
            <Tab id="overview"
                 title={
                   <React.Fragment>
                     <FormattedMessage id="collection.info.overview" defaultMessage="Overview"/>
                   </React.Fragment>
                 }
                 panel={<React.Fragment>
                   <CollectionOverview collection={collection} hasHeader={false}/>
                 </React.Fragment>
                 }
            />
            <Tab id="content"
                 title={
                   <React.Fragment>
                     <FormattedMessage id="collection.info.contents" defaultMessage="Contents"/>
                   </React.Fragment>
                 }
                 panel={<CollectionInfoContent collection={collection} schemata={collection.schemata}/>}
            />
            <Tab id="xref" disabled={xrefIndex.total === 0}
                 title={
                   <TextLoading loading={xrefIndex.total === undefined}>
                     <FormattedMessage id="collection.info.xref" defaultMessage="Cross-reference"/>
                     <TabCount count={xrefIndex.total} />
                  </TextLoading>
                 }
                 panel={<CollectionInfoXref xrefIndex={xrefIndex} collection={collection} />}
            />
          </Tabs>
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const xrefIndex = selectCollectionXrefIndex(state, ownProps.collection.id);
  return { xrefIndex };
};

CollectionInfo = connect(mapStateToProps, { fetchCollectionXrefIndex })(CollectionInfo);
CollectionInfo = injectIntl(CollectionInfo);
export default CollectionInfo;
