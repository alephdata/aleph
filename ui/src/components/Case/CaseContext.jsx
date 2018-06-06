import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';
import { withRouter } from "react-router";
import { FormattedMessage } from 'react-intl';
import c from 'classnames';

import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import { Collection } from 'src/components/common';
import { getColor } from "src/util/colorScheme";

import './CaseContext.css';


class CaseContext extends Component {
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
    const {collection, activeTab, className} = this.props;

    if (!collection.casefile) {
      return this.props.children;
    }

    return (
      <div className="CaseContext">
        <div className="case-menu" style={{backgroundColor: getColor(collection.id)}}>
          <Collection.Link collection={collection} />
          <Link to={`/collections/${collection.id}/documents`}
                className={c("menu-item", {"active": activeTab === 'Documents'})}>
            <Icon icon="folder-close" />
            <FormattedMessage id="case.context.documents" defaultMessage="Documents" />
          </Link>
          <a className={c("menu-item")} onClick={this.toggleAccess}>
            <Icon icon="key" />
            <FormattedMessage id="case.context.access" defaultMessage="Access control" />
          </a>
          <a className="menu-item" onClick={this.toggleSettings}>
            <Icon icon="cog" />
            <FormattedMessage id="case.context.settings" defaultMessage="Settings" />
          </a>
        </div>
        <div className={className}>
          {this.props.children}
        </div>
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
      </div>
    );
  }
}

CaseContext = withRouter(CaseContext);
export default (CaseContext);
