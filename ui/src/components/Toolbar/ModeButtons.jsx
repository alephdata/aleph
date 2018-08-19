import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { injectIntl, defineMessages, FormattedMessage } from 'react-intl';
import { Tooltip, Position } from '@blueprintjs/core';
import queryString from 'query-string';
import c from 'classnames';

import DownloadButton from 'src/components/Toolbar/DownloadButton';

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

class ModeButtons extends React.Component {
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

  render() {
    const { document, mode, isPreview, intl } = this.props;
    // const className = isPreview === true ? this.props.className : '';
    const hasTextMode = ['Pages', 'Image'].indexOf(document.schema) !== -1;
    const hasSearchMode = ['Pages'].indexOf(document.schema) !== -1;
    const hasModifiers = hasSearchMode || hasTextMode || isPreview;

    return (
      <div className="pt-button-group">
        { hasModifiers && (
          <Tooltip content={intl.formatMessage(messages.mode_view)} position={Position.BOTTOM_RIGHT}>
            <a onClick={(e) => this.setMode(e, 'view')}
              className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'view'})}>
              <span className="pt-icon-standard pt-icon-document"/>
              { !isPreview && (
                <FormattedMessage id="document.mode.view" defaultMessage="View"/>
              )}
            </a>
          </Tooltip>
        )}
        { hasTextMode && (
          <Tooltip content={intl.formatMessage(messages.mode_text)} position={Position.BOTTOM_RIGHT}>
            <a onClick={(e) => this.setMode(e, 'text')}
              className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'text'})}>
              <span className="pt-icon-standard pt-icon-align-justify"/>
              { !isPreview && (
                <FormattedMessage id="document.mode.text" defaultMessage="Text"/>
              )}
            </a>
          </Tooltip>
        )}
        <DownloadButton isPreview={isPreview} document={document} />
        { isPreview && (
          <Tooltip content={intl.formatMessage(messages.mode_info)} position={Position.BOTTOM_RIGHT}>
            <a onClick={(e) => this.setMode(e, 'info')}
              className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'info'})}>
              <span className="pt-icon-standard pt-icon-info-sign"/>
              { !isPreview && (
                <FormattedMessage id="document.mode.info" defaultMessage="Info"/>
              )}
            </a>
          </Tooltip>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const mode = hashQuery.mode || 'view';
  return { hashQuery, mode };
}

ModeButtons = connect(mapStateToProps, {})(ModeButtons);
ModeButtons = withRouter(ModeButtons);
ModeButtons = injectIntl(ModeButtons);
export default ModeButtons;