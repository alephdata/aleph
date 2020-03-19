import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { ErrorSection } from 'src/components/common';
import XrefTableRow from './XrefTableRow';

import './XrefTable.scss';

class XrefTable extends Component {
  renderHeader() {
    return (
      <thead>
        <tr>
          <th className="expand" />
          <th className="entity bordered">
            <span className="value">
              <FormattedMessage
                id="xref.entity"
                defaultMessage="Reference"
              />
            </span>
          </th>
          <th className="entity">
            <span className="value">
              <FormattedMessage
                id="xref.match"
                defaultMessage="Possible match"
              />
            </span>
          </th>
          <th className="numeric narrow">
            <span className="value">
              <FormattedMessage
                id="xref.score"
                defaultMessage="Score"
              />
            </span>
          </th>
          <th className="collection">
            <span className="value">
              <FormattedMessage
                id="xref.match_collection"
                defaultMessage="Dataset"
              />
            </span>
          </th>
        </tr>
      </thead>
    );
  }

  render() {
    const { expandedId, result, toggleExpand } = this.props;

    const skeletonItems = [...Array(15).keys()];

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }
    // if (!result.total || !result.results) {
    //   return null;
    // }

    return (
      <table className="data-table">
        {this.renderHeader()}
        <tbody>
          {result.results.map(xref => (
            <XrefTableRow xref={xref} expandedId={expandedId} toggleExpand={toggleExpand} />
          ))}
        </tbody>
      </table>
    );
  }
}

export default compose(
  injectIntl,
)(XrefTable);
