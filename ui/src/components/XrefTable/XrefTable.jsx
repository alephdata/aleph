import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { ErrorSection } from 'src/components/common';
import XrefTableRow from './XrefTableRow';

import './XrefTable.scss';

const messages = defineMessages({
  empty: {
    id: 'collection.xref.empty',
    defaultMessage: 'There are no cross-referencing results.',
  },
});


class XrefTable extends Component {
  renderHeader = () => (
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
  )

  render() {
    const { expandedId, intl, result, toggleExpand } = this.props;
    const skeletonItems = [...Array(15).keys()];

    if (result.isError) {
      return <ErrorSection error={result.error} />;
    }
    if (result.total === 0) {
      return (
        <ErrorSection
          icon="comparison"
          title={intl.formatMessage(messages.empty)}
        />
      );
    }

    return (
      <table className="XrefTable data-table">
        {this.renderHeader()}
        <tbody>
          {result.results.map(xref => (
            <XrefTableRow
              key={xref?.id}
              xref={xref}
              isExpanded={xref?.id === expandedId}
              toggleExpand={toggleExpand}
            />
          ))}
          {result.isPending && skeletonItems.map(item => (
            <XrefTableRow key={item} isPending />
          ))}
        </tbody>
      </table>
    );
  }
}

export default compose(
  injectIntl,
)(XrefTable);
