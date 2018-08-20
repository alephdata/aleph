import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages } from 'react-intl';
import c from 'classnames';
import queryString from "query-string";
import { Tooltip, Position } from '@blueprintjs/core';
import { connect } from "react-redux";

import { selectEntityTags } from "src/selectors";

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
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(hashQuery),
    })
  }

  render() {
    const {document, intl, mode, tags, isPreview} = this.props;
    const hasTextMode = [ 'Pages', 'Image' ].indexOf(document.schema) !== -1;
    const hasSearchMode = [ 'Pages' ].indexOf(document.schema) !== -1;
    const hasModifiers = hasSearchMode || hasTextMode || isPreview;
    const className = !isPreview ? 'ViewsMenu FullPage' : 'ViewsMenu';

    return (
      <div className={className}>
        {isPreview && (
          <Tooltip content={intl.formatMessage(messages.mode_info)} position={Position.BOTTOM_RIGHT}>
            <a onClick={(e) => this.setMode(e, 'info')}
               className={c('ModeButtons', 'pt-button pt-large', {'pt-active': mode === 'info'})}>
              <span className="pt-icon-standard pt-icon-info-sign"/>
            </a></Tooltip>)}
        {hasModifiers && (<Tooltip content={intl.formatMessage(messages.mode_view)} position={Position.BOTTOM_RIGHT}>
          <a onClick={(e) => this.setMode(e, 'view')}
             className={c('ModeButtons', 'pt-button pt-large', {'pt-active': mode === 'view'})}>
            <span className="pt-icon-standard pt-icon-document"/>
          </a></Tooltip>)}
        {hasTextMode && (<Tooltip content={intl.formatMessage(messages.mode_text)} position={Position.BOTTOM_RIGHT}>
          <a onClick={(e) => this.setMode(e, 'text')}
             className={c('ModeButtons', 'pt-button pt-large', {'pt-active': mode === 'text'})}>
            <span className="pt-icon-standard pt-icon-align-justify"/>
          </a></Tooltip>)}
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