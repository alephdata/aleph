import React, { Component } from 'react';
import {
  defineMessages,
  injectIntl,
  FormattedMessage,
} from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { Callout, Intent } from '@blueprintjs/core';

import withRouter from 'app/withRouter'
import Query from 'app/Query';
import Dashboard from 'components/Dashboard/Dashboard';
import Screen from 'components/Screen/Screen';
import CollectionIndex from 'components/CollectionIndex/CollectionIndex';
import LoadingScreen from 'components/Screen/LoadingScreen';
import { fetchRole, queryCollections } from 'actions';
import { selectRole } from 'selectors';
import { showWarningToast } from 'app/toast';

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
  constructor(props) {
    super(props)

    this.goToEntitySearch = this.goToEntitySearch.bind(this);
  }
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

  async goToEntitySearch() {
    const { navigate, groupId } = this.props;

    const query = new Query('collections', {}, { 'filter:team_id': groupId }, 'collections').limit(1000);
    try {
      const qReturn = await this.props.queryCollections({ query });
      const groupCollections = qReturn.result?.results;
      if (groupCollections) {
        const params = {
          'filter:collection_id': groupCollections.map(coll => coll.id),
          facet: 'collection_id',
          'facet_size:collection_id': 10,
          'facet_total:collection_id': true,
        };
        navigate({
          pathname: '/search',
          search: queryString.stringify(params)
        })
      }
    } catch (e) {
      showWarningToast(e.message);
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
            <Callout intent={Intent.PRIMARY} style={{ marginTop: '20px' }}>
              <FormattedMessage
                id="group.page.search.description"
                defaultMessage="If you would like to search for specific entities or documents within the datasets that this group has access to, <link>click here</link> instead."
                values={{
                  // eslint-disable-next-line
                  link: chunks => <a role="button" onClick={this.goToEntitySearch}>{chunks}</a>,
                }}
              />
            </Callout>
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
  withRouter,
  connect(mapStateToProps, { fetchRole, queryCollections }),
  injectIntl,
)(GroupScreen);
