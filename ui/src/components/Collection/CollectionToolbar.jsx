import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { Button } from "@blueprintjs/core";

import { Toolbar, CloseButton } from 'src/components/Toolbar';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import { withRouter } from "react-router";
import { xrefMatches } from "src/actions";
import { connect } from "react-redux";
import { selectCollectionXrefIndex } from "../../selectors";
import queryString from "query-string";
import { showWarningToast, showSuccessToast } from "src/app/toast";

const messages = defineMessages({
  processingCrossRef: {
    id: 'collection.toolbar.processingCrossRef',
    defaultMessage: 'We are processing this collection. Come back in few moments.'
  },
  successCrossRef: {
    id: 'collection.toolbar.successCrossRef',
    defaultMessage: 'The collection has been cross-referenced. Please refresh the page!'
  },
});

class CollectionToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsIsOpen: false,
      accessIsOpen: false,
      disabled: false
    };

    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
    this.onCrossRef = this.onCrossRef.bind(this);
  }

  toggleSettings() {
    this.setState({ settingsIsOpen: !this.state.settingsIsOpen });
  }

  toggleAccess() {
    this.setState({ accessIsOpen: !this.state.accessIsOpen });
  }

  async onCrossRef() {
    const { history, location, collection, intl } = this.props;
    showWarningToast(intl.formatMessage(messages.processingCrossRef));
    const parsedHash = queryString.parse(location.hash);
    this.setState({disabled: true});
    await this.props.xrefMatches(collection.id);
    this.setState({disabled: false});
    showSuccessToast(intl.formatMessage(messages.successCrossRef));
    parsedHash['preview:id'] = collection.id;
    parsedHash['preview:type'] = 'collection';
    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { collection, isPreview } = this.props;
    const { settingsIsOpen, accessIsOpen, disabled } = this.state;

    return (
      <Toolbar className="toolbar-preview">
        <div className="pt-button-group">
          <Link to={`/search?filter:collection_id=${collection.id}`} className="pt-button button-link">
            <span className={`pt-icon-search`}/>
            <FormattedMessage id="collection.info.search_button" defaultMessage="Search"/>
          </Link>
          {collection.writeable &&
            <React.Fragment>
              <Button icon="cog" onClick={this.toggleSettings}>
                <FormattedMessage id="collection.info.edit_button" defaultMessage="Settings"/>
              </Button>
              <Button icon="key" onClick={this.toggleAccess} className='button-hover'>
                <FormattedMessage id="collection.info.access" defaultMessage="Access"/>
              </Button>
              <Button icon="folder-open" onClick={this.onCrossRef} className='button-hover' disabled={disabled}>
                <FormattedMessage id="collection.info.cross.ref" defaultMessage="Cross-ref"/>
              </Button>
            </React.Fragment>
          }
        </div>
        {isPreview && (
          <CloseButton/>
        )}
        <CollectionEditDialog collection={collection}
                              isOpen={settingsIsOpen}
                              toggleDialog={this.toggleSettings} />
        <CollectionAccessDialog collection={collection}
                                isOpen={accessIsOpen}
                                toggleDialog={this.toggleAccess} />
      </Toolbar>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    data: state.data,
    xrefIndex: selectCollectionXrefIndex(state, ownProps.collection.id)
  };
};

CollectionToolbar = connect(mapStateToProps, { xrefMatches })(CollectionToolbar);
CollectionToolbar = injectIntl(CollectionToolbar);
CollectionToolbar = withRouter(CollectionToolbar);
export default CollectionToolbar;
