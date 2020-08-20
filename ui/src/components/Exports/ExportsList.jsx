import React, { Component } from "react";
import { defineMessages, injectIntl } from "react-intl";
import { compose } from "redux";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { Waypoint } from "react-waypoint";
import { ErrorSection } from "src/components/common";
import { fetchExports } from "src/actions";
import Export from "src/components/Exports/Export";

import "./ExportsList.scss";

const messages = defineMessages({
  no_exports: {
    id: "exports.no_exports",
    defaultMessage: "You have no exports to download",
  },
});

class ExportsList extends Component {
  constructor(props) {
    super(props);
    const { exports } = this.props;
    if (exports.total === undefined) {
      this.props.fetchExports();
    }
  }

  componentDidMount() {
    this.props.fetchExports();
  }

  render() {
    const { exports, intl } = this.props;
    const skeletonItems = [...Array(15).keys()];

    if (exports.total === 0) {
      return (
        <ErrorSection
          icon="download"
          title={intl.formatMessage(messages.no_exports)}
        />
      );
    }

    return (
      <>
        <table className="ExportsTable data-table">
          <thead>
            <tr>
              <th className="wide">Name</th>
              <th>Size</th>
              <th>Status</th>
              <th>Expiration</th>
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
        <Waypoint
          onEnter={this.getMoreResults}
          bottomOffset="-300px"
          scrollableAncestor={window}
        />
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  exports: state.exports,
});

const mapDispatchToProps = {
  fetchExports,
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
  injectIntl
)(ExportsList);
