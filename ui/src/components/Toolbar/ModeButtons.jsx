import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { FormattedMessage } from 'react-intl';
import queryString from 'query-string';
import c from 'classnames';

import getPath from 'src/util/getPath';


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
    const { document, mode, isPreview } = this.props;
    // const className = isPreview === true ? this.props.className : '';
    const hasTextMode = ['Pages', 'Image'].indexOf(document.schema) !== -1;
    const hasSearchMode = ['Pages'].indexOf(document.schema) !== -1;
    const hasModifiers = hasSearchMode || hasTextMode || isPreview;

    return (
      <div className="pt-button-group">
        { hasModifiers && (
          <a onClick={(e) => this.setMode(e, 'view')}
             className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'view'})}>
            <span className="pt-icon-standard pt-icon-document"/>
            { !isPreview && (
              <FormattedMessage id="document.mode.view" defaultMessage="View"/>
            )}
          </a>
        )}
        { isPreview && (
          <a onClick={(e) => this.setMode(e, 'info')}
             className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'info'})}>
            <span className="pt-icon-standard pt-icon-info-sign"/>
            { !isPreview && (
              <FormattedMessage id="document.mode.info" defaultMessage="Info"/>
            )}
          </a>
        )}
        { hasTextMode && (
          <a onClick={(e) => this.setMode(e, 'text')}
             className={c('ModeButtons', 'pt-button', {'pt-active': mode === 'text'})}>
            <span className="pt-icon-standard pt-icon-align-justify"/>
            { !isPreview && (
              <FormattedMessage id="document.mode.text" defaultMessage="Text"/>
            )}
          </a>
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
export default ModeButtons;