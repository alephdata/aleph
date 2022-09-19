import React, { PureComponent } from 'react';
import { FormattedMessage } from 'react-intl';

import './TextLoading.scss';

export default class TextLoading extends PureComponent {
  render() {
    const { loading, children } = this.props;
    if (loading) {
      return (
        <span className="TextLoading">
          <FormattedMessage id="text.loading" defaultMessage="Loading…" />
        </span>
      );
    }
    return children;
  }
}
