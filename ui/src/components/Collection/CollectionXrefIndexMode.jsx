import React from 'react';
import { Link } from 'react-router-dom';
import { ButtonGroup, AnchorButton, Button } from '@blueprintjs/core';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl, FormattedNumber, FormattedMessage } from 'react-intl';

import { Collection, SectionLoading, ErrorSection } from 'src/components/common';
import CollectionXrefDialog from 'src/dialogs/CollectionXrefDialog/CollectionXrefDialog';
import getCollectionLink from 'src/util/getCollectionLink';
import { selectCollectionXrefIndex, selectSession } from 'src/selectors';

import './CollectionXrefIndexMode.scss';

const messages = defineMessages({
  empty: {
    id: 'collection.xref.empty',
    defaultMessage: 'There are no cross-referencing results.',
  },
});


export class CollectionXrefIndexMode extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { xrefIsOpen: false };
    this.toggleXref = this.toggleXref.bind(this);
  }

  toggleXref() {
    this.setState(({ xrefIsOpen }) => ({ xrefIsOpen: !xrefIsOpen }));
  }

  renderTable() {
    const { intl, collection, xrefIndex } = this.props;
    if (xrefIndex.total === 0) {
      return (
        <ErrorSection
          icon="search-around"
          title={intl.formatMessage(messages.empty)}
        />
      );
    }
    const linkPath = `${getCollectionLink(collection)}/xref/`;
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th className="entity">
              <span className="value">
                <FormattedMessage
                  id="xref.collection"
                  defaultMessage="Cross-referenced dataset"
                />
              </span>
            </th>
            <th className="numeric">
              <span className="value">
                <FormattedMessage
                  id="xref.matches"
                  defaultMessage="Matches"
                />
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {xrefIndex.results.map(xref => (
            <tr key={xref.collection.id}>
              <td className="entity">
                <Link to={`${linkPath}${xref.collection.id}`}>
                  <Collection.Label collection={xref.collection} />
                </Link>
              </td>
              <td className="numeric">
                <FormattedNumber value={xref.matches} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  render() {
    const { session, collection, xrefIndex } = this.props;
    if (xrefIndex.status === undefined) {
      return <SectionLoading />;
    }
    return (
      <section className="CollectionXrefTable">
        { session.loggedIn && (
          <ButtonGroup>
            <Button icon="play" disabled={!collection.writeable} onClick={this.toggleXref}>
              <FormattedMessage
                id="xref.compute"
                defaultMessage="Compute"
              />
            </Button>
            <AnchorButton icon="download" href={collection.links.xref_export} download disabled={!xrefIndex.total}>
              <FormattedMessage
                id="xref.download"
                defaultMessage="Download Excel"
              />
            </AnchorButton>
          </ButtonGroup>
        )}
        {this.renderTable()}
        <CollectionXrefDialog
          collection={collection}
          isOpen={this.state.xrefIsOpen}
          toggleDialog={this.toggleXref}
        />
      </section>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collection } = ownProps;
  return {
    xrefIndex: selectCollectionXrefIndex(state, collection.id),
    session: selectSession(state),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionXrefIndexMode);
