import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { Collection, SectionLoading, ErrorSection } from 'src/components/common';
import { queryDashboard } from 'src/actions';
import { selectDashboardResult } from 'src/selectors';
import { Link } from 'react-router-dom';
import getCollectionLink from 'src/util/getCollectionLink';

import './Dashboard.scss';

const messages = defineMessages({
  no_active_collection: {
    id: 'dashboard.no_active_collection',
    defaultMessage: 'There are no active collections',
  },
});


class Dashboard extends Component {
  componentDidMount() {
    this.fetchIfNeeded();
    this.interval = setInterval(() => this.fetchIfNeeded(), 10000);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchIfNeeded();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  fetchIfNeeded() {
    const { result, query } = this.props;
    if (!result.isLoading) {
      this.props.queryDashboard({ query });
    }
  }

  render() {
    const { result, intl } = this.props;
    return (
      <React.Fragment>
        { result.total === 0
          && (
          <ErrorSection
            visual="dashboard"
            title={intl.formatMessage(messages.no_active_collection)}
          />
          )
        }
        { result.total !== 0 && (
          <table className="Dashboard">
            <thead>
              <tr>
                <th>Collection</th>
                <th>Finished Jobs</th>
                <th>Pending Jobs</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map(res => (
                (
                  <tr key={res.id}>
                    <td className="entity">
                      <Link to={getCollectionLink(res.collection)}>
                        <Collection.Label collection={res.collection} />
                      </Link>
                    </td>
                    <td>{res.finished}</td>
                    <td>{res.pending}</td>
                  </tr>
                )
              ))}
            </tbody>
          </table>
        )}
        { result.isLoading && (
          <SectionLoading />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;
  const result = selectDashboardResult(state, query);
  return { query, result };
};
const mapDispatchToProps = { queryDashboard };

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl,
)(Dashboard);
