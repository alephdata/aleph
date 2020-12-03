import React, { Component } from 'react';
import { FormattedMessage, injectIntl } from 'react-intl';
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


class ProfileItemsMode extends Component {
  constructor(props) {
    super(props);
    this.onDecide = this.onDecide.bind(this);
  }

  async onDecide(obj) {
    try {
      await this.props.updateEntitySetItemMutate({
        judgement: obj.judgement,
        entitySetId: this.props.profile.id,
        entityId: obj.entity.id,
      });
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
          <EntityCompare entity={item.entity} other={this.props.profile.merged} />
        </td>
        <td className="collection">
          <Collection.Link collection={item.entity.collection} icon />
        </td>
      </tr>
    );
  }

  render() {
    const { result } = this.props;
    return (
      <div className="ProfileItemsMode">
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
            {result.results?.map(res => this.renderRow(res))}
          </tbody>
        </table>
      </div>
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
