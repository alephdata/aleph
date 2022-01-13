import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';
import { Callout } from '@blueprintjs/core';
import c from 'classnames';
import queryString from 'query-string';

import withRouter from 'app/withRouter'
import { selectSimilarResult } from 'selectors';
import {
  QueryInfiniteLoad, JudgementButtons, Score, Collection, EntityDecisionHotkeys, EntityDecisionRow,
} from 'components/common';
import EntityCompare from 'components/Entity/EntityCompare';
import { profileSimilarQuery } from 'queries';
import { querySimilar, updateEntitySetItemMutate } from 'actions';
import { showWarningToast } from 'app/toast';


class ProfileItemsMode extends Component {
  constructor(props) {
    super(props);
    this.onDecide = this.onDecide.bind(this);
  }

  async onDecide(obj) {
    const { profile, location, history } = this.props;
    try {
      const item = await this.props.updateEntitySetItemMutate({
        judgement: obj.judgement,
        entitySetId: profile.id,
        entityId: obj.entity.id,
      });
      if (item.data.entityset_id && profile.id !== item.data.entityset_id) {
        history.replace({
          pathname: `/profiles/${item.data.entityset_id}`,
          search: location.search,
          hash: location.hash,
        });
      }
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  renderRow(item, index) {
    const { selectedIndex } = this.props;
    return (
      <EntityDecisionRow key={item.id || item.entity.id} selected={index === selectedIndex}>
        <td className="numeric narrow">
          <JudgementButtons obj={item} onChange={this.onDecide} />
        </td>
        <td className="entity bordered">
          <EntityCompare entity={item.entity} other={this.props.profile.entity} />
        </td>
        <td className="numeric narrow">
          <Score score={item.score} />
        </td>
        <td className="collection">
          <Collection.Link collection={item.entity.collection} icon />
        </td>
      </EntityDecisionRow>
    );
  }

  render() {
    const { query, result } = this.props;
    if (result.total === 0) {
      return (
        <Callout icon="similar" intent="primary">
          <FormattedMessage
            id="profile.similar.no_results"
            defaultMessage="No suggested additions for this profile were found."
          />
        </Callout>
      );
    }
    return (
      <div className="ProfileSimilarMode">
        <EntityDecisionHotkeys result={result} onDecide={this.onDecide}>
          <table className={c("data-table", { 'pending': result.isPending })}>
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
              {result.results?.map((res, i) => this.renderRow(res, i))}
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
  const { profile, location } = ownProps;
  const query = profileSimilarQuery(location, profile.id);
  const parsedHash = queryString.parse(location.hash);

  return {
    query,
    result: selectSimilarResult(state, query),
    selectedIndex: +parsedHash.selectedIndex
  };
};

ProfileItemsMode = connect(mapStateToProps, { querySimilar, updateEntitySetItemMutate })(ProfileItemsMode);
ProfileItemsMode = withRouter(ProfileItemsMode);
export default ProfileItemsMode;
