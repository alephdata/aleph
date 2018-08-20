import React from 'react';
import { withRouter } from 'react-router';
import { connect } from "react-redux";
import { injectIntl, defineMessages } from 'react-intl';
import c from 'classnames';
import { Tooltip, Position } from '@blueprintjs/core';

import { fetchCollectionXrefIndex } from "src/actions";
import { selectCollectionXrefIndex } from "src/selectors";
import getPath from "src/util/getPath";

import './ViewsMenu.css';

const messages = defineMessages({
  open: {
    id: 'document.mode.text.open',
    defaultMessage: 'Browse as a folder',
  },
  xref: {
    id: 'document.mode.text.xref',
    defaultMessage: 'Cross-reference',
  }
});

class CollectionViewsMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const {collection, xrefIndex} = this.props;
    if (collection.id !== undefined && xrefIndex.results === undefined && !xrefIndex.isLoading) {
      this.props.fetchCollectionXrefIndex(collection);
    }
  }

  render() {
    const {intl, showToolbar, collection, xrefIndex} = this.props;
    return (
      <div className='ViewsMenu'>
        {showToolbar && (
          <Tooltip content={intl.formatMessage(messages.open)} position={Position.BOTTOM_RIGHT}>
            <a href={`/collections/${collection.id}/documents`}
               className={c('ModeButtons', 'pt-button pt-large')}>
              <i className="fa fa-fw fal fa-folder-open"/>
            </a>
          </Tooltip>
        )}
        <Tooltip content={intl.formatMessage(messages.xref)} position={Position.BOTTOM_RIGHT}>
          <a href={`/collections/${collection.id}/xref`}
             className={c('ModeButtons', 'pt-button pt-large')}>
            <i className="fa fa-fw fal fa-folder-open"/>
          </a>
        </Tooltip>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const xrefIndex = selectCollectionXrefIndex(state, ownProps.collection.id);
  return {xrefIndex};
};

CollectionViewsMenu = connect(mapStateToProps, {fetchCollectionXrefIndex})(CollectionViewsMenu);
CollectionViewsMenu = injectIntl(CollectionViewsMenu);
CollectionViewsMenu = withRouter(CollectionViewsMenu);
export default CollectionViewsMenu;