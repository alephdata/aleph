import React from 'react';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import c from 'classnames';
import queryString from "query-string";
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
    const { history, location, hashQuery } = this.props;
    event.preventDefault();
    hashQuery.mode = mode;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(hashQuery),
    })
  }

  onClickConnections(event, connection) {

  }

  render() {
    const { document, intl, mode, tags, isPreview } = this.props;
    const hasTextMode = ['Pages', 'Image'].indexOf(document.schema) !== -1;
    const hasSearchMode = ['Pages'].indexOf(document.schema) !== -1;
    const hasModifiers = hasSearchMode || hasTextMode || isPreview;

    return (
      <div className='ViewsMenu'>
        { isPreview && (<a onClick={(e) => this.setMode(e, 'info')}
             className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'info'})} title={intl.formatMessage(messages.mode_info)} >
            <span className="pt-icon-standard pt-icon-info-sign"/>
          </a>)}
        { hasModifiers && ( <a onClick={(e) => this.setMode(e, 'view')}
             className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'view'})} title={intl.formatMessage(messages.mode_view)}>
            <span className="pt-icon-standard pt-icon-document"/>
          </a>)}
        { hasTextMode && (<a onClick={(e) => this.setMode(e, 'text')}
             className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'text'})} title={intl.formatMessage(messages.mode_text)}>
            <span className="pt-icon-standard pt-icon-align-justify"/>
          </a>)}
        <a onClick={(e) => this.onClickConnections(e, 'connection')}
           className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'text'})} title={intl.formatMessage(messages.mode_text)}>
          <span className="pt-icon-standard pt-icon-align-justify"/>
        </a>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const mode = hashQuery.mode || 'view';
  return {
    hashQuery,
    mode,
    tags: selectEntityTags(state, ownProps.document.id)};
};


DocumentViewsMenu = connect(mapStateToProps, {})(DocumentViewsMenu);
DocumentViewsMenu = injectIntl(DocumentViewsMenu);
DocumentViewsMenu = withRouter(DocumentViewsMenu);
export default DocumentViewsMenu;