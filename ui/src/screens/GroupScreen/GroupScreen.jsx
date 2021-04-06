import React, { Component } from 'react';
import {
  defineMessages,
  injectIntl,
  FormattedMessage,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Query from 'app/Query';
import Dashboard from 'components/Dashboard/Dashboard';
import Screen from 'components/Screen/Screen';
import CollectionIndex from 'components/CollectionIndex/CollectionIndex';
import LoadingScreen from 'components/Screen/LoadingScreen';
import { fetchRole, queryCollections } from 'actions';
import { selectRole } from 'selectors';

import './GroupScreen.scss';


const messages = defineMessages({
  empty: {
    id: 'sources.index.empty',
    defaultMessage: 'This group is not linked to any datasets or investigations.',
  },
  placeholder: {
    id: 'sources.index.placeholder',
    defaultMessage: 'Search for a dataset or investigation belonging to {group}...',
  },
});


export class GroupScreen extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { group, groupId } = this.props;
    if (group.shouldLoad) {
      this.props.fetchRole({ id: groupId });
    }
  }

  render() {
    const { group, query, intl } = this.props;
    if (group.isPending) {
      return <LoadingScreen requireSession />;
    }
    return (
      <Screen className="GroupScreen" title={group.label} requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{group.label}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="group.page.description"
                defaultMessage="The list below shows all datasets and investigations that belong to this group."
              />
            </p>
          </div>
          <CollectionIndex
            query={query}
            emptyText={intl.formatMessage(messages.empty)}
            placeholder={intl.formatMessage(messages.placeholder, { group: group.label })}
          />
        </Dashboard>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { location, match } = ownProps;
  const { groupId } = match.params;

  const context = { 'filter:team_id': groupId };
  const query = Query.fromLocation('collections', location, context, 'collections')
    .defaultSortBy('created_at', 'desc')
    .limit(20);

  return {
    query,
    groupId,
    group: selectRole(state, groupId),
  };
};

export default compose(
  connect(mapStateToProps, { fetchRole, queryCollections }),
  injectIntl,
)(GroupScreen);
