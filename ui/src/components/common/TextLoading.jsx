import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';

import './TextLoading.css';


class TextLoading extends PureComponent {
  render() {
    const { loading } = this.props;
    if (loading) {
      return (
        <span className="TextLoading">
          <FormattedMessage id="text.loading" defaultMessage="Loading…" />
        </span>
      );
    }
    return this.props.children;
  }
}

export default TextLoading;