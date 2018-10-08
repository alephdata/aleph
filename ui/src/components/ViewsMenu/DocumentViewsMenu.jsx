import React from 'react';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { injectIntl, defineMessages } from 'react-intl';

import { queryEntitySimilar } from 'src/queries';
import { selectEntityTags, selectEntitiesResult } from "src/selectors";
import ViewItem from "src/components/ViewsMenu/ViewItem";

import './ViewsMenu.css';

const messages = defineMessages({
  view: {
    id: 'document.mode.view.tooltip',
    defaultMessage: 'Show the document',
  },
  info: {
    id: 'document.mode.info.tooltip',
    defaultMessage: 'Show properties and details',
  },
  text: {
    id: 'document.mode.text.tooltip',
    defaultMessage: 'Show extracted text',
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

  render() {
    const { intl, document, isPreview, activeMode, similar, tags } = this.props;
    const hasTextMode = [ 'Pages', 'Image' ].indexOf(document.schema) !== -1;
    const hasSearchMode = [ 'Pages' ].indexOf(document.schema) !== -1;
    const hasModifiers = hasSearchMode || hasTextMode || isPreview;
    const className = !isPreview ? 'ViewsMenu FullPage' : 'ViewsMenu';

    return (
      <div className={className}>
        {isPreview && (
          <ViewItem mode='info' activeMode={activeMode} isPreview={isPreview}
            message={intl.formatMessage(messages.info)}
            icon='pt-icon-info-sign' />
        )}
        {hasModifiers && (
          <ViewItem mode='view' activeMode={activeMode} isPreview={isPreview}
            message={intl.formatMessage(messages.view)}
            href={`/documents/${document.id}#mode=view`}
            icon='pt-icon-document' />
        )}
        {hasTextMode && (
          <ViewItem mode='text'
                    activeMode={activeMode}
                    isPreview={isPreview}
                    message={intl.formatMessage(messages.text)}
                    href={`/documents/${document.id}#mode=text`}
                    icon='pt-icon-align-justify' />
        )}
        <ViewItem mode='tags' activeMode={activeMode} isPreview={isPreview}
                  count={tags.total}
                  message={intl.formatMessage(messages.tags)}
                  href={`/documents/${document.id}/tags`}
                  icon='pt-icon-tag' />
        <ViewItem mode='similar' activeMode={activeMode}
                  isPreview={isPreview}
                  count={similar.total}
                  message={intl.formatMessage(messages.similar)}
                  href={`/documents/${document.id}/similar`}
                  icon='pt-icon-tag' />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};


DocumentViewsMenu = connect(mapStateToProps, {})(DocumentViewsMenu);
DocumentViewsMenu = withRouter(DocumentViewsMenu);
DocumentViewsMenu = injectIntl(DocumentViewsMenu);
export default DocumentViewsMenu;