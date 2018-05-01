import React from 'react';
import { FormattedMessage } from 'react-intl';

import './TextLoading.css';


export default class TextLoading extends React.Component {
  render() {
    const { loading, children } = this.props;
    if (loading) {
      return (<span class="TextLoading">
        <FormattedMessage id="text.loading" defaultMessage="Loading…" />
      </span>);
    }
    return (<React.Fragment>{children}</React.Fragment>);
  }
}
