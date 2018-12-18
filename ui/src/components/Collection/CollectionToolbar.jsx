import React, {Component} from 'react';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { Button, Menu, Position, Popover } from "@blueprintjs/core";

import { Toolbar, CloseButton } from 'src/components/Toolbar';
import CollectionEditDialog from 'src/dialogs/CollectionEditDialog/CollectionEditDialog';
import CollectionAccessDialog from 'src/dialogs/CollectionAccessDialog/CollectionAccessDialog';
import CollectionXrefAlert from 'src/components/Collection/CollectionXrefAlert';
import { selectCollectionXrefIndex } from "../../selectors";
import CollectionAnalyzeAlert from "./CollectionAnalyzeAlert";


class CollectionToolbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      settingsIsOpen: false,
      accessIsOpen: false,
      xrefIsOpen: false,
      analyzeIsOpen: false,
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

  toggleAnalyze = () => {
    this.setState(({analyzeIsOpen }) => ({ analyzeIsOpen : !analyzeIsOpen  }));
  };

  render() {
    const { collection, isPreview } = this.props;
    const { settingsIsOpen, accessIsOpen, xrefIsOpen, analyzeIsOpen } = this.state;

    return (
      <Toolbar className="toolbar-preview">
        <div className="bp3-button-group">
          <Link to={`/search?filter:collection_id=${collection.id}`} className="bp3-button button-link">
            <span className={`bp3-icon-search`}/>
            <FormattedMessage id="collection.info.search_button" defaultMessage="Search"/>
          </Link>
          {collection.writeable &&
            <React.Fragment>
              <Popover content={<Menu>
                <Menu.Item
                  icon="cog"
                  onClick={this.toggleSettings}
                  text={<FormattedMessage id="collection.info.edit_button" defaultMessage="Settings"/>} />
                <Menu.Item
                  icon="key"
                  onClick={this.toggleAccess}
                  text={<FormattedMessage id="collection.info.share" defaultMessage="Share"/>}
                />
                <Menu.Divider />
                <Menu.Item
                  icon="search-around"
                  onClick={this.toggleXref}
                  text={<FormattedMessage id="collection.info.xref" defaultMessage="Cross-reference"/>}
                />
                <Menu.Item
                  icon="automatic-updates"
                  onClick={this.toggleAnalyze}
                  text={<FormattedMessage id="collection.info.analyze" defaultMessage="Re-Analyze"/>}
                />

              </Menu>} position={Position.RIGHT_TOP}>
                <Button icon="control" text="Control..." />
              </Popover>

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
        <CollectionAnalyzeAlert collection={collection}
                                isOpen={analyzeIsOpen}
                                toggleAlert={this.toggleAnalyze} />
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
