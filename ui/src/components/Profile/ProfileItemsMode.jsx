{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}

import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Callout, Intent } from '@blueprintjs/core';
import c from 'classnames';
import queryString from 'query-string';

import withRouter from 'app/withRouter'
import { selectEntitySetItemsResult } from 'selectors';
import {
  JudgementButtons, Collection, EntityDecisionHotkeys, EntityDecisionRow,
} from 'components/common';
import EntityCompare from 'components/Entity/EntityCompare';
import { entitySetItemsQuery } from 'queries';
import { updateEntitySetItemMutate } from 'actions';
import { showWarningToast } from 'app/toast';

import Skeleton from 'components/common/Skeleton';


class ProfileItemsMode extends Component {
  constructor(props) {
    super(props);
    this.onDecide = this.onDecide.bind(this);
  }

  async onDecide(obj) {
    const { profile, location, navigate } = this.props;
    try {
      const item = await this.props.updateEntitySetItemMutate({
        judgement: obj.judgement,
        entitySetId: profile.id,
        entityId: obj.entity.id,
      });

      if (item.entityset_id && profile.id !== item.entityset_id) {
        navigate({
          pathname: `/profiles/${item.entityset_id}`,
          search: location.search,
          hash: location.hash,
        }, { replace: true });
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
        <td className="collection">
          <Collection.Link collection={item.collection} icon />
        </td>
      </EntityDecisionRow>
    );
  }

  renderSkeleton(idx) {
    const obj = { writeable: false, judgement: 'no_judgement' };
    return (
      <tr key={idx}>
        <td className="numeric narrow">
          <JudgementButtons obj={obj} onChange={this.onDecide} />
        </td>
        <td className="entity bordered">
          <EntityCompare isPending={true} />
        </td>
        <td className="collection">
          <Skeleton.Text type="span" length="20" />
        </td>
      </tr>
    );
  }

  render() {
    const { result } = this.props;
    const skeletonItems = [...Array(15).keys()];
    return (
      <div className="ProfileItemsMode">
        <Callout intent={Intent.PRIMARY} icon={null} style={{ 'marginBottom': '10px'}}>
          <FormattedMessage
            id="profile.items.explanation"
            defaultMessage="Make decisions below to determine which source entities should be added or excluded from this profile."
          />
        </Callout>
        <EntityDecisionHotkeys result={result} onDecide={this.onDecide}>
          <table className={c("data-table", { 'pending': result.isPending })}>
            <thead>
              <tr>
                <th className="numeric narrow" />
                <th>
                  <span className="value">
                    <FormattedMessage
                      id="profile.items.entity"
                      defaultMessage="Combined entities"
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
              {!result.total && result.isPending && skeletonItems.map(idx => this.renderSkeleton(idx))}
            </tbody>
          </table>
        </EntityDecisionHotkeys>
      </div >
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { profile, location } = ownProps;
  const query = entitySetItemsQuery(location, profile.id);
  const parsedHash = queryString.parse(location.hash);

  return {
    query,
    result: selectEntitySetItemsResult(state, query),
    selectedIndex: +parsedHash.selectedIndex
  };
};

ProfileItemsMode = connect(mapStateToProps, { updateEntitySetItemMutate })(ProfileItemsMode);
ProfileItemsMode = withRouter(ProfileItemsMode);
ProfileItemsMode = injectIntl(ProfileItemsMode);
export default ProfileItemsMode;
