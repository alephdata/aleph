import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Callout } from '@blueprintjs/core';
import queryString from 'query-string';

import withRouter from 'app/withRouter';
import { querySimilar } from 'actions';
import { selectSimilarResult } from 'selectors';
import {
  ErrorSection,
  QueryInfiniteLoad,
  JudgementButtons,
  Score,
  Collection,
  Skeleton,
  EntityDecisionHotkeys,
  EntityDecisionRow,
} from 'components/common';
import EntityCompare from 'components/Entity/EntityCompare';
import { entitySimilarQuery } from 'queries';
import { pairwiseJudgement } from 'actions';
import { showWarningToast } from 'app/toast';

const messages = defineMessages({
  empty: {
    id: 'entity.similar.empty',
    defaultMessage: 'There are no similar entities.',
  },
});

class EntitySimilarMode extends Component {
  constructor(props) {
    super(props);
    this.onDecide = this.onDecide.bind(this);
  }

  async onDecide(obj) {
    try {
      await this.props.pairwiseJudgement({
        judgement: obj.judgement,
        entity: this.props.entity,
        match: obj.entity,
      });
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  renderSummary() {
    const { result } = this.props;
    if (result.total === undefined || result.total === 0) {
      return null;
    }

    return (
      <Callout icon={null} intent="primary">
        <FormattedMessage
          id="entity.similar.found_text"
          defaultMessage={`Found {resultCount}
            {resultCount, plural, one {similar entity} other {similar entities}}
            from {datasetCount}
            {datasetCount, plural, one {dataset} other {datasets}}
          `}
          values={{
            resultCount: result.total,
            datasetCount: result.facets.collection_id.total,
          }}
        />
      </Callout>
    );
  }

  renderHeader() {
    return (
      <thead>
        <tr>
          <th className="numeric narrow" />
          <th>
            <span className="value">
              <FormattedMessage
                id="entity.similar.entity"
                defaultMessage="Similar entity"
              />
            </span>
          </th>
          <th className="numeric narrow">
            <span className="value">
              <FormattedMessage id="xref.score" defaultMessage="Score" />
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

  renderSkeleton(idx) {
    return (
      <tr key={idx}>
        <td className="numeric narrow">
          <JudgementButtons isPending />
        </td>
        <td className="entity bordered">
          <EntityCompare isPending />
        </td>
        <td className="numeric narrow">
          <Skeleton.Text type="span" length={3} />
        </td>
        <td className="collection">
          <Skeleton.Text type="span" length={10} />
        </td>
      </tr>
    );
  }

  renderRow(similar, index) {
    const { selectedIndex } = this.props;
    return (
      <EntityDecisionRow
        key={similar.entity.id}
        selected={index === selectedIndex}
      >
        <td className="numeric narrow">
          <JudgementButtons obj={similar} onChange={this.onDecide} />
        </td>
        <td className="entity bordered">
          <EntityCompare entity={similar.entity} other={this.props.entity} />
        </td>
        <td className="numeric narrow">
          <Score score={similar.score} />
        </td>
        <td className="collection">
          <Collection.Link collection={similar.entity.collection} icon />
        </td>
      </EntityDecisionRow>
    );
  }

  render() {
    const { intl, query, result } = this.props;
    const skeletonItems = [...Array(10).keys()];

    if (result.total === 0) {
      return (
        <ErrorSection
          icon="similar"
          title={intl.formatMessage(messages.empty)}
        />
      );
    }

    return (
      <div className="EntitySimilarMode">
        {this.renderSummary()}
        <EntityDecisionHotkeys result={result} onDecide={this.onDecide}>
          <table className="data-table">
            {this.renderHeader()}
            <tbody>
              {result.results?.map((res, i) => this.renderRow(res, i))}
              {result.isPending &&
                skeletonItems.map((idx) => this.renderSkeleton(idx))}
            </tbody>
          </table>
        </EntityDecisionHotkeys>
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={this.props.querySimilar}
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  const query = entitySimilarQuery(location, entity.id);
  const result = selectSimilarResult(state, query);

  const parsedHash = queryString.parse(location.hash);

  return { query, result, selectedIndex: +parsedHash.selectedIndex };
};

EntitySimilarMode = connect(mapStateToProps, {
  querySimilar,
  pairwiseJudgement,
})(EntitySimilarMode);
EntitySimilarMode = withRouter(EntitySimilarMode);
EntitySimilarMode = injectIntl(EntitySimilarMode);
export default EntitySimilarMode;
