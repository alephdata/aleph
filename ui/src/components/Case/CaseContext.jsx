import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Icon } from '@blueprintjs/core';
import { withRouter } from "react-router";
import { FormattedMessage } from 'react-intl';
import c from 'classnames';

import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import { Collection } from 'src/components/common';
import { fetchCollectionXrefIndex } from 'src/actions';
import { selectCollectionXrefIndex } from 'src/selectors';
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

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate(prevProps) {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { collection, xrefIndex } = this.props;
    if (collection.casefile && xrefIndex.results === undefined && !xrefIndex.isLoading) {
      this.props.fetchCollectionXrefIndex(collection);
    }
  }

  toggleSettings() {
    this.setState({isSettingsOpen: !this.state.isSettingsOpen});
  }

  toggleAccess() {
    this.setState({isAccessOpen: !this.state.isAccessOpen});
  }

  render() {
    const {collection, xrefIndex, activeTab} = this.props;

    if (!collection.casefile) {
      return this.props.children;
    }

    let xrefUrl = null;
    if (xrefIndex.results !== undefined && xrefIndex.results.length) {
      const other = xrefIndex.results[0].collection;
      xrefUrl = `/collections/${collection.id}/xref/${other.id}`;
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
          { xrefUrl && (
            <Link to={xrefUrl}
                  className={c("menu-item", {"active": activeTab === 'Xref'})}>
              <Icon icon="resolve" />
              <FormattedMessage id="case.context.crossref" defaultMessage="Cross-referencing" />
            </Link>
          )}
          <a className={c("menu-item")} onClick={this.toggleAccess}>
            <Icon icon="key" />
            <FormattedMessage id="case.context.access" defaultMessage="Access control" />
          </a>
          <a className="menu-item" onClick={this.toggleSettings}>
            <Icon icon="cog" />
            <FormattedMessage id="case.context.settings" defaultMessage="Settings" />
          </a>
        </div>
        {this.props.children}
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

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  const xrefIndex = selectCollectionXrefIndex(state, collection.id);
  return { xrefIndex };
};

CaseContext = withRouter(CaseContext);
CaseContext = connect(mapStateToProps, { fetchCollectionXrefIndex })(CaseContext);
export default (CaseContext);
