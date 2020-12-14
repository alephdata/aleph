import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { AnchorButton, ButtonGroup, Classes, ControlGroup, Tooltip } from '@blueprintjs/core';

import { ResultText } from 'components/common';

import './SearchActionBar.scss';


class SearchActionBar extends Component {
  render() {
    const { children, intl, result } = this.props;

    return (
      <ControlGroup className="SearchActionBar" fill>
        <div className="SearchActionBar__main text-muted">
          <ResultText result={result} />
        </div>
        {children}
      </ControlGroup>
    );
  }
}

export default compose(
  withRouter,
  injectIntl,
)(SearchActionBar);
