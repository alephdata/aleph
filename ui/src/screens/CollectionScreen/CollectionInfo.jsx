import React, {Component} from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Button, Tab, Tabs } from "@blueprintjs/core";

import { fetchCollectionPermissions } from 'src/actions';
import { Toolbar, CloseButton } from 'src/components/Toolbar';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog';
import AccessCollectionDialog from 'src/dialogs/AccessCollectionDialog';
import DualPane from 'src/components/common/DualPane';
import CollectionInfoXref from './CollectionInfoXref';
import CollectionOverview from "../../components/Collection/CollectionOverview";

class CollectionInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'overview',
      collectionInfoIsOpen: false,
      permissions: props.permissions,
      collectionXRefTab: false,
      accessIsOpen: false
    };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.toggleCollectionEdit = this.toggleCollectionEdit.bind(this);
    this.fetchCollection = this.fetchCollection.bind(this);
    this.onCollectionXRefLoad = this.onCollectionXRefLoad.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
  }

  componentDidMount() {
    const { collection } = this.props;
    this.setState({ permissions: [] });
    this.props.fetchCollectionPermissions(collection.id);
  }

  fetchCollection() {
    const { collection } = this.props;
    this.setState({ permissions: [] });
    this.props.fetchCollectionPermissions(collection.id);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      permissions: nextProps.permissions,
      collectionXRefTab: false
    });
  }

  handleTabChange(activeTabId: TabId) {
    this.setState({ activeTabId });
  }

  toggleCollectionEdit() {
    this.setState({
      collectionInfoIsOpen: !this.state.collectionInfoIsOpen
    })
  }

  toggleAccess() {
    this.setState({
      accessIsOpen: !this.state.accessIsOpen
    })
  }
  
  onCollectionXRefLoad(collection, xRefs) {
    if (xRefs && xRefs.total && xRefs.total > 0) {
      this.setState({
        collectionXRefTab: true
      });
    }
  }

  render() {
    const {collection, showToolbar } = this.props;
    const {permissions, activeTabId, collectionXRefTab, collectionInfoIsOpen, accessIsOpen} = this.state;
    
    // @TODO Discussion: 'Search Collection' link to update the current query?
    return (
      <DualPane.InfoPane className="CollectionInfo with-heading">
        {showToolbar && (
          <Toolbar className="toolbar-preview">
            <Link to={`/search?filter:collection_id=${collection.id}`} className="pt-button button-link">
              <span className={`pt-icon-search`}/>
              <FormattedMessage id="collection.info..search_button" defaultMessage="Search"/>
            </Link>
            {collection.writeable &&
              <React.Fragment>
                <Button icon="cog" onClick={this.toggleCollectionEdit}>
                  <FormattedMessage id="collection.info.edit_button" defaultMessage="Settings"/>
                </Button>
                <CollectionEditDialog
                  collection={collection}
                  isOpen={collectionInfoIsOpen}
                  toggleDialog={this.toggleCollectionEdit}
                />
                <Button icon="cog" onClick={this.toggleAccess}>
                  <FormattedMessage id="collection.info.access" defaultMessage="Access"/>
                </Button>
                <AccessCollectionDialog
                  collection={collection}
                  isOpen={accessIsOpen}
                  toggleDialog={this.toggleAccess}
                  permissions={permissions}
                />
              </React.Fragment>}
            <CloseButton/>
          </Toolbar>
        )}
        <div className="pane-heading">
          <span>
            <FormattedMessage id="collection.info.heading" defaultMessage="Source"/>
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
                  <FormattedMessage id="collection .info.overview" defaultMessage="Overview"/>
                </React.Fragment>
              }
              panel={
                <CollectionOverview collection={collection} hasHeader={false}/>
              }
            />
            <Tab id="xref"
              disabled={!collectionXRefTab}
              title={
                <React.Fragment>
                  <FormattedMessage id="collection.info.source" defaultMessage="Cross-reference"/>
                </React.Fragment>
              }
              panel={<CollectionInfoXref onCollectionXRefLoad={this.onCollectionXRefLoad} collection={collection} />}
            />
            <Tabs.Expander />
          </Tabs>
        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const collectionId = ownProps.collection.id;
  return {
    collectionId,
    permissions: state.collectionPermissions[collectionId] || []
  };
};

export default connect(mapStateToProps, {fetchCollectionPermissions})(CollectionInfo);
