import _ from 'lodash';
import React from 'react';
import { connect } from "react-redux";
import { injectIntl, defineMessages } from 'react-intl';

import { selectEntityTags } from "src/selectors";
import ViewItem from "src/components/ViewsMenu/ViewItem";

import './ViewsMenu.css';

const messages = defineMessages({
  info: {
    id: 'document.mode.info.tooltip',
    defaultMessage: 'Show properties and details',
  },
  view: {
    id: 'document.mode.view.tooltip',
    defaultMessage: 'Show the document',
  },
  browse: {
    id: 'document.mode.browse.tooltip',
    defaultMessage: 'Browse documents',
  },
  text: {
    id: 'document.mode.text.tooltip',
    defaultMessage: 'Show text',
  },
  tags: {
    id: 'document.tags',
    defaultMessage: 'Show connections'
  },
  similar: {
    id: 'document.similar',
    defaultMessage: 'Show similar documents'
  }
});


class DocumentViewsMenu extends React.Component {
  
  hasSchemata(schemata) {
    const { document } = this.props;
    return _.intersection(document.schemata, schemata).length > 0;
  }

  render() {
    const { intl, document, isPreview, activeMode } = this.props;
    const { tags } = this.props;

    const hasTextMode = this.hasSchemata(['Pages', 'Image', 'PlainText']);
    const hasBrowseMode = this.hasSchemata(['Folder']);
    const hasViewer = this.hasSchemata(['Pages', 'Email', 'Image', 'HyperText', 'Table']);
    const hasViewMode = hasViewer || (!hasBrowseMode && !hasTextMode);

    return (
      <div className="ViewsMenu">
        {isPreview && (
          <ViewItem mode='info' activeMode={activeMode} isPreview={isPreview}
            message={intl.formatMessage(messages.info)}
            icon='fa-info' />
        )}
        {hasViewMode && (
          <ViewItem mode='view'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.view)}
                    href={`/documents/${document.id}#mode=view`}
                    icon='fa-file-o' />
        )}
        {hasBrowseMode && (
          <ViewItem mode='browse'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.browse)}
                    href={`/documents/${document.id}#mode=browse`}
                    icon='fa-folder-open'
                    count={document.children} />
        )}
        {hasTextMode && (
          <ViewItem mode='text'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.text)}
                    href={`/documents/${document.id}#mode=text`}
                    icon='fa-align-justify' />
        )}
        <ViewItem mode='tags' activeMode={activeMode} isPreview={isPreview}
                  count={tags.total}
                  message={intl.formatMessage(messages.tags)}
                  href={`/documents/${document.id}/tags`}
                  icon='fa-tags' />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document } = ownProps;
  return {
    tags: selectEntityTags(state, document.id)
  };
};


DocumentViewsMenu = connect(mapStateToProps, {})(DocumentViewsMenu);
DocumentViewsMenu = injectIntl(DocumentViewsMenu);
export default DocumentViewsMenu;