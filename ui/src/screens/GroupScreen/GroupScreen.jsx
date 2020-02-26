import React, { Component } from 'react';
import {
  defineMessages,
  injectIntl,
  FormattedMessage,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import Query from 'src/app/Query';
import Dashboard from 'src/components/Dashboard/Dashboard';
import Screen from 'src/components/Screen/Screen';
import CollectionIndex from 'src/components/CollectionIndex/CollectionIndex';
import LoadingScreen from 'src/components/Screen/LoadingScreen';
import { queryCollections, fetchGroups } from 'src/actions';
import { selectGroups, selectRole } from 'src/selectors';

import './GroupScreen.scss';


const messages = defineMessages({
  empty: {
    id: 'sources.index.empty',
    defaultMessage: 'This group is not linked to any datasets.',
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
    const { groups } = this.props;
    if (groups.shouldLoad) {
      this.props.fetchGroups();
    }
  }

  render() {
    const { group, query, intl } = this.props;
    if (!group || !group.id) {
      return <LoadingScreen />;
    }
    return (
      <Screen className="GroupScreen" title={group.label} requireSession>
        <Dashboard>
          <div className="Dashboard__title-container">
            <h5 className="Dashboard__title">{group.label}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="group.page.description"
                defaultMessage="The list below shows all datasets that belong to this group."
              />
            </p>
          </div>
          <CollectionIndex
            query={query}
            noResultsText={intl.formatMessage(messages.empty)}
          />
        </Dashboard>
      </Screen>
    );
  }
}
const mapStateToProps = (state, ownProps) => {
  const { groupId } = ownProps.match.params;
  let query = Query.fromLocation('collections', {}, {}, 'collections')
    .setFilter('team_id', groupId)
    .limit(20);

  if (!query.hasSort()) {
    query = query.sortBy('created_at', 'desc');
  }

  return {
    query,
    group: selectRole(state, groupId),
    groups: selectGroups(state),
  };
};

export default compose(
  connect(mapStateToProps, { fetchGroups, queryCollections }),
  injectIntl,
)(GroupScreen);
