import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Callout } from '@blueprintjs/core';

import { selectEntitySetItemsResult } from 'selectors';
import {
  JudgementButtons, Collection,
} from 'components/common';
import EntityCompare from 'components/Entity/EntityCompare';
import { entitySetItemsQuery } from 'queries';
import { updateEntitySetItemMutate } from 'actions';
import { showWarningToast } from 'app/toast';
import { Entity } from '@alephdata/react-ftm';
import getEntityLink from 'util/getEntityLink';

import Skeleton from 'components/common/Skeleton';


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

      if (item.entityset_id && profile.id !== item.entityset_id) {
        history.replace({
          pathname: `/profiles/${item.entityset_id}`,
          search: location.search,
          hash: location.hash,
        });
      }
    } catch (e) {
      showWarningToast(e.message);
    }
  }

  renderRow(item) {
    return (
      <tr key={item.id || item.entity.id}>
        <td className="numeric narrow">
          <JudgementButtons obj={item} onChange={this.onDecide} />
        </td>
        <td className="entity bordered">
          <EntityCompare entity={item.entity} other={this.props.profile.entity} />
        </td>
        <td className="collection">
          <Collection.Link collection={item.collection} icon />
        </td>
      </tr>
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
    const { profile, result, viaEntityId } = this.props;
    const skeletonItems = [...Array(15).keys()];
    return (
      <div className="ProfileItemsMode">
        <Callout intent="primary" className="ProfileItemsMode__callout">
          <strong>
            <FormattedMessage
              id="profile.items.intro"
              defaultMessage={"You're viewing {entity} as a profile. "}
              values={{
                entity: <Entity.Label entity={profile.entity} />,
              }}
            />
          </strong>
          <FormattedMessage
            id="profile.items.intro"
            defaultMessage={"The profile aggregates attributes and relationships from {count} entities across different datasets. You can select what source entities to include in the list below. "}
            values={{
              count: profile.entities ? profile.entities.length : 0,
            }}
          />
          {viaEntityId && (
            <FormattedMessage
              id="profile.items.intro"
              defaultMessage={"View the <link>original entity</link>."}
              values={{
                link: chunks => <Link to={getEntityLink(viaEntityId, false)}>{chunks}</Link >,
              }}
            />
          )}
        </Callout>
        <table className="data-table">
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
            {result.results?.map(res => this.renderRow(res))}
            {result.isPending && skeletonItems.map(idx => this.renderSkeleton(idx))}
          </tbody>
        </table>
      </div >
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { profile, location } = ownProps;
  const query = entitySetItemsQuery(location, profile.id);
  return {
    query,
    result: selectEntitySetItemsResult(state, query)
  };
};

ProfileItemsMode = connect(mapStateToProps, { updateEntitySetItemMutate })(ProfileItemsMode);
ProfileItemsMode = withRouter(ProfileItemsMode);
ProfileItemsMode = injectIntl(ProfileItemsMode);
export default ProfileItemsMode;
