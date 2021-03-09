import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { withRouter } from 'react-router';

import { ErrorSection, EntityDecisionHotkeys } from 'components/common';
import { showWarningToast } from 'app/toast';
import { pairwiseJudgement } from 'actions';
import XrefTableRow from './XrefTableRow';

import './XrefTable.scss';

const messages = defineMessages({
  empty: {
    id: 'collection.xref.empty',
    defaultMessage: 'There are no cross-referencing results.',
  },
});


class XrefTable extends Component {
  constructor(props) {
    super(props);
    this.onDecide = this.onDecide.bind(this);
  }

  async onDecide(xref) {
    try {
      await this.props.pairwiseJudgement(xref);
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  renderHeader = () => (
    <thead>
      <tr>
        <th className="numeric narrow" />
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
    const { intl, result, selectedIndex } = this.props;
    const skeletonItems = [...Array(25).keys()];

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
      <EntityDecisionHotkeys result={result} onDecide={this.onDecide}>
        <table className="XrefTable data-table">
          {this.renderHeader()}
          <tbody>
            {result.results.map((xref, i) => (
              <XrefTableRow
                key={xref.id}
                xref={xref}
                onDecide={this.onDecide}
                selected={i === selectedIndex}
              />
            ))}
            {result.isPending && skeletonItems.map(item => (
              <XrefTableRow key={item} isPending />
            ))}
          </tbody>
        </table>
      </EntityDecisionHotkeys>
    );
  }
}


const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const parsedHash = queryString.parse(location.hash);

  return {
    selectedIndex: +parsedHash.selectedIndex
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { pairwiseJudgement }),
  injectIntl,
)(XrefTable);
