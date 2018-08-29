import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages } from 'react-intl';
import queryString from "query-string";
import { connect } from "react-redux";

import { selectEntityTags } from "src/selectors";
import ViewItem from "src/components/ViewsMenu/ViewItem";

import './ViewsMenu.css';

const messages = defineMessages({
  mode_view: {
    id: 'document.mode.view.tooltip',
    defaultMessage: 'Show the document',
  },
  mode_info: {
    id: 'document.mode.info.tooltip',
    defaultMessage: 'Show properties and details',
  },
  mode_text: {
    id: 'document.mode.text.tooltip',
    defaultMessage: 'Show extracted text',
  },
  connections: {
    id: 'document.connections',
    defaultMessage: 'Show connections'
  },
  similar: {
    id: 'document.similar',
    defaultMessage: 'Show similar documents'
  }
});

class DocumentViewsMenu extends React.Component {
  constructor(props) {
    super(props);
    this.setMode = this.setMode.bind(this);
  }

  setMode(event, mode) {
    const {history, location, hashQuery} = this.props;
    event.preventDefault();
    hashQuery.mode = mode;
    history.replace({
      pathname: location.pathname.replace('/connections',''),
      search: location.search,
      hash: queryString.stringify(hashQuery),
    })
  }

  render() {
    const {document, intl, mode, tags, isPreview, isActive} = this.props;
    const hasTextMode = [ 'Pages', 'Image' ].indexOf(document.schema) !== -1;
    const hasSearchMode = [ 'Pages' ].indexOf(document.schema) !== -1;
    const hasModifiers = hasSearchMode || hasTextMode || isPreview;
    const className = !isPreview ? 'ViewsMenu FullPage' : 'ViewsMenu';

    return (
      <div className={className}>
        {isPreview && (
          <ViewItem
            message={intl.formatMessage(messages.mode_info)}
            mode='info'
            isActive={mode === 'info' && isActive !== 'connections'}
            isPreview={true}
            onClick={this.setMode}
            icon='pt-icon-info-sign' />
        )}
        {hasModifiers && (
          <ViewItem
            message={intl.formatMessage(messages.mode_view)}
            mode='view'
            isActive={mode === 'view' && isActive !== 'connections'}
            isPreview={true}
            onClick={this.setMode}
            icon='pt-icon-document' />
        )}
        {hasTextMode && (
          <ViewItem
            message={intl.formatMessage(messages.mode_text)}
            mode='text'
            isActive={mode === 'text' && isActive !== 'connections'}
            isPreview={true}
            onClick={this.setMode}
            icon='pt-icon-align-justify' />
        )}
        {tags.total !== 0 && (
          <ViewItem
            message={intl.formatMessage(messages.connections)}
            href={'/documents/' + document.id + '/connections'}
            isActive={isActive === 'connections'}
            isPreview={false}
            icon='pt-icon-tag' />
        )}
        <ViewItem
          message={intl.formatMessage(messages.similar)}
          href={'/documents/' + document.id + '/similar'}
          isActive={isActive === 'similar'}
          isPreview={false}
          icon='pt-icon-tag' />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const {location} = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const mode = hashQuery.mode || 'view';
  return {
    hashQuery,
    mode,
    tags: selectEntityTags(state, ownProps.document.id)
  };
};


DocumentViewsMenu = connect(mapStateToProps, {})(DocumentViewsMenu);
DocumentViewsMenu = injectIntl(DocumentViewsMenu);
DocumentViewsMenu = withRouter(DocumentViewsMenu);
export default DocumentViewsMenu;