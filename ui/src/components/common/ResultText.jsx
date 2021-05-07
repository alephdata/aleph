import React, { PureComponent } from 'react';
import { FormattedNumber, FormattedMessage } from 'react-intl';

import './ResultText.scss'

class ResultText extends PureComponent {
  renderText() {
    const { customText, result } = this.props;
    if (result?.isError) {
      return <FormattedMessage id="result.error" defaultMessage="Error" />;
    }
    if (!result || result.total === undefined) {
      return <FormattedMessage id="result.searching" defaultMessage="Searching..." />;
    }

    if (customText) {
      return customText;
    }
    if (result.total_type === 'gte') {
      return (
        <FormattedMessage
          id="result.more_results"
          defaultMessage="More than {total} results"
          values={{
            total: <FormattedNumber value={result.total} />,
          }}
        />
      );
    }
    if (result.total === 0) {
      return <FormattedMessage id="result.none" defaultMessage="No results found" />;
    }
    if (result.total === 1) {
      return <FormattedMessage id="result.solo" defaultMessage="One result found" />;
    }
    return (
      <FormattedMessage
        id="result.results"
        defaultMessage="Found {total} results"
        values={{
          total: <FormattedNumber value={result.total} />,
        }}
      />
    );
  }

  render() {
    return (
      <span className="ResultText text-muted">
        {this.renderText()}
      </span>
    )
  }
}

export default ResultText;
