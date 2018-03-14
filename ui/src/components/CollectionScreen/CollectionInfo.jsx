import React, {Component} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import { Button, Tab, Tabs } from "@blueprintjs/core";

import DualPane from 'src/components/common/DualPane';
import Category from 'src/components/common/Category';
import Language from 'src/components/common/Language';
import Country from 'src/components/common/Country';
import Role from 'src/components/common/Role';
import Date from 'src/components/common/Date';

import CollectionInfoXref from './CollectionInfoXref';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog';

import { fetchCollectionPermissions } from 'src/actions';
import CollectionPermissionsEdit from "../CollectionPermissions/CollectionPermissionsEdit";

class CollectionInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeTabId: 'overview',
      collectionInfoIsOpen: false,
      permissions: props.permissions
    };

    this.handleTabChange = this.handleTabChange.bind(this);
    this.toggleCollectionEdit = this.toggleCollectionEdit.bind(this);
    this.fetchCollection = this.fetchCollection.bind(this);
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
        permissions: nextProps.permissions
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

  render() {
    const {collection} = this.props;
    const {permissions, activeTabId, collectionInfoIsOpen} = this.state;

    return (
      <DualPane.InfoPane className="CollectionInfo with-heading">
        <div className="pane-heading">
          <span>
            <FormattedMessage id="collection.info.heading" defaultMessage="Source"/>
          </span>
          <h1>
            {collection.label}
          </h1>
        </div>
        <div className="collection-content">
          <Tabs id="CollectionInfoTabs" large="true" onChange={this.handleTabChange} selectedTabId={activeTabId}>
            <Tab id="overview"
              title={
                <React.Fragment>
                  <span className="pt-icon-standard pt-icon-info-sign"/>
                  <FormattedMessage id="collection .info.overview" defaultMessage="Overview"/>
                </React.Fragment>
              }
              panel={
                <React.Fragment>
                  <p>{collection.summary}</p>
                  <ul className='info-sheet'>
                    <li>
                      <span className="key">
                        <FormattedMessage id="collection.info.category" defaultMessage="Category"/>
                      </span>
                      <span className="value">
                        <Category collection={collection}/>
                      </span>
                    </li>
                    {collection.creator && (
                      <li>
                        <span className="key">
                          <FormattedMessage id="collection.info.creator" defaultMessage="Manager"/>
                        </span>
                        <span className="value">
                          <Role.Label role={collection.creator}/>
                        </span>
                      </li>
                    )}
                    {collection.languages && !!collection.languages.length && (
                      <li>
                        <span className="key">
                          <FormattedMessage id="collection.info.languages" defaultMessage="Language"/>
                        </span>
                        <span className="value">
                          <Language.List codes={collection.languages}/>
                        </span>
                      </li>
                    )}
                    {collection.countries && !!collection.countries.length && (
                      <li>
                        <span className="key">
                          <FormattedMessage id="collection.info.countries" defaultMessage="Country"/>
                        </span>
                        <span className="value">
                          <Country.List codes={collection.countries} truncate={10}/>
                        </span>
                      </li>
                    )}
                    <li>
                      <span className="key">
                        <FormattedMessage id="collection.info.updated_at" defaultMessage="Last updated"/>
                      </span>
                      <span className="value">
                        <Date value={collection.updated_at}/>
                      </span>
                    </li>
                  </ul>
                  {collection.writeable &&
                    <React.Fragment>
                      <Button className="pt-fill" onClick={this.toggleCollectionEdit}>
                        <FormattedMessage id="collection.info.edit"
                                          defaultMessage="Edit info"/>
                      </Button>
                      <CollectionEditDialog
                        collection={collection}
                        isOpen={collectionInfoIsOpen}
                        toggleDialog={this.toggleCollectionEdit}
                      />
                    </React.Fragment>}
                </React.Fragment>
              }
            />
            <Tab id="xref"
              title={
                <React.Fragment>
                  <span className="pt-icon-standard pt-icon-database"/>
                  <FormattedMessage id="collection.info.source" defaultMessage="Cross-reference"/>
                </React.Fragment>
              }
              panel={<CollectionInfoXref collection={collection} />}
            />
            {collection.writeable && <Tab id="permissions"
                 title={
                   <React.Fragment>
                     <span className="pt-icon-standard pt-icon-database"/>
                     <FormattedMessage id="collection.info.source" defaultMessage="Permissions"/>
                   </React.Fragment>
                 }
                 panel={<CollectionPermissionsEdit collection={collection} permissions={permissions} />}
            />}
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
