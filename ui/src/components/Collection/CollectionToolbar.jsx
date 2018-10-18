import React, {Component} from 'react';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Button } from "@blueprintjs/core";

import { Toolbar, CloseButton } from 'src/components/Toolbar';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionXrefAlert from 'src/components/Collection/CollectionXrefAlert';
import { selectCollectionXrefIndex } from "../../selectors";


class CollectionToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsIsOpen: false,
      accessIsOpen: false,
      xrefIsOpen: false,
    };

    this.toggleSettings = this.toggleSettings.bind(this);
    this.toggleAccess = this.toggleAccess.bind(this);
    this.toggleXref = this.toggleXref.bind(this);
  }

  toggleSettings() {
    this.setState({ settingsIsOpen: !this.state.settingsIsOpen });
  }

  toggleAccess() {
    this.setState({ accessIsOpen: !this.state.accessIsOpen });
  }

  toggleXref() {
    this.setState({ xrefIsOpen: !this.state.xrefIsOpen });
  }

  render() {
    const { collection, isPreview } = this.props;
    const { settingsIsOpen, accessIsOpen, xrefIsOpen } = this.state;

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
              <Button icon="search-around" onClick={this.toggleXref} className='button-hover'>
                <FormattedMessage id="collection.info.xref" defaultMessage="Cross-reference"/>
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
        <CollectionXrefAlert collection={collection}
                             isOpen={xrefIsOpen}
                             toggleAlert={this.toggleXref} />
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

CollectionToolbar = connect(mapStateToProps, null)(CollectionToolbar);
CollectionToolbar = withRouter(CollectionToolbar);
export default CollectionToolbar;
