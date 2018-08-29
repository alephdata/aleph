import React from 'react';
import { withRouter } from 'react-router';
import { connect } from "react-redux";
import { injectIntl, defineMessages } from 'react-intl';

import { fetchCollectionXrefIndex } from "src/actions";
import { selectCollectionXrefIndex } from "src/selectors";
import ViewItem from "src/components/ViewsMenu/ViewItem";

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
    const {intl, isPreview, collection, activeMode, xrefIndex} = this.props;
    return (
      <div className='ViewsMenu'>
        <ViewItem mode='documents' activeMode={activeMode}
                  isPreview={isPreview}
                  message={intl.formatMessage(messages.open)}
                  href={`/collections/${collection.id}/documents`}
                  icon='fa-folder-open' />
        <ViewItem mode='xref' activeMode={activeMode}
                  isPreview={isPreview}
                  message={intl.formatMessage(messages.xref)}
                  href={`/collections/${collection.id}/xref`}
                  icon='fa-folder-open' />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const xrefIndex = selectCollectionXrefIndex(state, ownProps.collection.id);
  return { xrefIndex };
};

CollectionViewsMenu = connect(mapStateToProps, {fetchCollectionXrefIndex})(CollectionViewsMenu);
CollectionViewsMenu = injectIntl(CollectionViewsMenu);
CollectionViewsMenu = withRouter(CollectionViewsMenu);
export default CollectionViewsMenu;