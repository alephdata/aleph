import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages } from 'react-intl';

import ViewItem from "src/components/ViewsMenu/ViewItem";
import { selectCollectionXrefIndex } from 'src/selectors';

import './ViewsMenu.css';

const messages = defineMessages({
  info: {
    id: 'document.mode.text.info',
    defaultMessage: 'Overview',
  },
  documents: {
    id: 'document.mode.text.documents',
    defaultMessage: 'Browse as a folder',
  },
  xref: {
    id: 'document.mode.text.xref',
    defaultMessage: 'Cross-reference',
  }
});


class CollectionViewsMenu extends React.Component {
  
  hasDocuments() {
    // FIXME: give better metadata from API.
    const docTypes = ['Document', 'Pages', 'Folder', 'Package', 'Email', 'HyperText', 'Workbook', 'Table', 'PlainText', 'Image', 'Video', 'Audio'];
    const { collection } = this.props;
    const { schemata } = collection;
    for (let key in schemata) {
      if (docTypes.indexOf(key) !== -1) {
        return true;
      }
    }
    return false;
  }

  render() {
    const { intl, isPreview, collection, activeMode } = this.props;
    const { xrefIndex } = this.props;
    // TODO: add case home page / timeline....
    return (
      <div className='ViewsMenu'>
        {isPreview && (
          <ViewItem mode='info' activeMode={activeMode} isPreview={isPreview}
                  message={intl.formatMessage(messages.info)}
                  icon='fa-info' />
        )}
        <ViewItem mode='documents' activeMode={activeMode} isPreview={isPreview}
                  disabled={!this.hasDocuments()}
                  message={intl.formatMessage(messages.documents)}
                  href={`/collections/${collection.id}/documents`}
                  icon='fa-folder-open' />
        <ViewItem mode='xref' activeMode={activeMode} isPreview={isPreview}
                  disabled={xrefIndex.total === 0}
                  message={intl.formatMessage(messages.xref)}
                  href={`/collections/${collection.id}/xref`}
                  icon='fa-folder-open' />
      </div>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    xrefIndex: selectCollectionXrefIndex(state, collection.id)
  };
};

CollectionViewsMenu = connect(mapStateToProps, {})(CollectionViewsMenu);
CollectionViewsMenu = injectIntl(CollectionViewsMenu);
CollectionViewsMenu = withRouter(CollectionViewsMenu);
export default CollectionViewsMenu;