import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Callout } from '@blueprintjs/core';

import { selectEntitySetItemsResult, selectSimilarResult } from 'selectors';
import {
  QueryInfiniteLoad, JudgementButtons, Score, Collection,
} from 'components/common';
import EntityCompare from 'components/Entity/EntityCompare';
import { profileSimilarQuery, entitySetItemsQuery } from 'queries';
import { querySimilar, updateEntitySetItem } from 'actions';
import { showWarningToast } from 'app/toast';


class ProfileItemsMode extends Component {
  constructor(props) {
    super(props);
    this.onDecide = this.onDecide.bind(this);
  }

  async onDecide(obj) {
    try {
      await this.props.updateEntitySetItem({
        judgement: obj.judgement,
        entitySetId: this.props.profile.id,
        entityId: obj.entity.id,
      });
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  // renderSummary() {
  //   const { result } = this.props;
  //   if (result.isPending || result.total === 0
  //     || !result.facets || !result.facets.collection_id) {
  //     return null;
  //   }

  //   return (
  //     <Callout icon={null} intent="primary">
  //       <FormattedMessage
  //         id="entity.similar.found_text"
  //         defaultMessage={`Found {resultCount}
  //           {resultCount, plural, one {similar entity} other {similar entities}}
  //           from {datasetCount}
  //           {datasetCount, plural, one {dataset} other {datasets}}
  //         `}
  //         values={{
  //           resultCount: result.total,
  //           datasetCount: result.facets.collection_id.total,
  //         }}
  //       />
  //     </Callout>
  //   );
  // }

  renderRow(item) {
    return (
      <tr key={item.id || item.entity.id}>
        <td className="numeric narrow">
          <JudgementButtons obj={item} onChange={this.onDecide} />
        </td>
        <td className="entity bordered">
          <EntityCompare entity={item.entity} other={this.props.profile.merged} />
        </td>
        { item.score !== undefined && (
          <td className="numeric narrow">
            <Score score={item.score} />
          </td>
        )}
        <td className="collection">
          <Collection.Link collection={item.entity.collection} icon />
        </td>
      </tr>
    );
  }

  renderItems() {
    const { itemsResult } = this.props;

    if (itemsResult.total === 0) {
      return null;
    }

    return (
      <>
        <table className="data-table">
          <thead>
            <tr>
              <th className="numeric narrow" />
              <th>
                <span className="value">
                  <FormattedMessage
                    id="profile.items.entity"
                    defaultMessage="Part of this profile"
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
          <tbody>
            {itemsResult.results?.map(res => this.renderRow(res))}
          </tbody>
        </table>
      </>
    );
  }

  renderSimilar() {
    const { similarQuery, similarResult } = this.props;

    if (similarResult.total === 0) {
      return (
        <Callout icon="snowflake" intent="primary">
          <FormattedMessage
            id="profile.similar.no_results"
            defaultMessage="No suggested additions for this profile were found."
          />
        </Callout>
      );
    }

    return (
      <>
        <table className="data-table">
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
          <tbody>
            {similarResult.results?.map(res => this.renderRow(res))}
          </tbody>
        </table>
        <QueryInfiniteLoad
          query={similarQuery}
          result={similarResult}
          fetch={this.props.querySimilar}
        />
      </>
    );
  }

  render() {
    return (
      <div className="ProfileItemsMode">
        {this.renderItems()}
        {this.renderSimilar()}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { profile, location } = ownProps;
  const similarQuery = profileSimilarQuery(location, profile.id);
  const itemsQuery = entitySetItemsQuery(location, profile.id);
  return {
    similarQuery,
    similarResult: selectSimilarResult(state, similarQuery),
    itemsQuery,
    itemsResult: selectEntitySetItemsResult(state, itemsQuery)
  };
};

ProfileItemsMode = connect(mapStateToProps, { querySimilar, updateEntitySetItem })(ProfileItemsMode);
ProfileItemsMode = withRouter(ProfileItemsMode);
ProfileItemsMode = injectIntl(ProfileItemsMode);
export default ProfileItemsMode;
