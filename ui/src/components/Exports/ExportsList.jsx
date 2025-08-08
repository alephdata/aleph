import React, { Component } from 'react';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from '/src/app/withRouter.jsx';
import { ErrorSection } from '/src/components/common/index.jsx';
import { selectExports } from '/src/selectors.js';
import { fetchExports } from '/src/actions/index.js';
import Export from '/src/components/Exports/Export';

const messages = defineMessages({
  no_exports: {
    id: 'exports.no_exports',
    defaultMessage: 'You have no exports to download',
  },
});

class ExportsList extends Component {
  componentDidMount() {
    // fetch new export on every mount so that we can show recently created
    // exports without needing a reload
    this.props.fetchExports();
  }
  render() {
    const { exports, intl } = this.props;
    const skeletonItems = [...Array(15).keys()];

    if (exports.total === 0) {
      return (
        <ErrorSection
          icon="export"
          title={intl.formatMessage(messages.no_exports)}
        />
      );
    }

    return (
      <>
        <table className="ExportsTable data-table">
          <thead>
            <tr>
              <th className="wide">
                <FormattedMessage id="exports.name" defaultMessage="Name" />
              </th>
              <th>
                <FormattedMessage id="exports.size" defaultMessage="Size" />
              </th>
              <th>
                <FormattedMessage id="exports.status" defaultMessage="Status" />
              </th>
              <th>
                <FormattedMessage
                  id="exports.expiration"
                  defaultMessage="Expiration"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {exports.results &&
              exports.results.map((export_) => (
                <Export key={export_.id} export_={export_} />
              ))}
            {exports.isPending &&
              skeletonItems.map((item) => <Export key={item} isPending />)}
          </tbody>
        </table>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  exports: selectExports(state),
});

const mapDispatchToProps = {
  fetchExports,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ExportsList);
