import React, { Component } from 'react';
import { FormattedMessage, defineMessages, injectIntl } from 'react-intl';
// import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { fetchRoleDiagrams } from 'src/actions';
// import { selectCollectionDiagrams, selectRoleDiagrams } from 'src/selectors';
import Screen from 'src/components/Screen/Screen';
import Dashboard from 'src/components/Dashboard/Dashboard';
import {
  Breadcrumbs,
} from 'src/components/common';
import DiagramCreateButton from 'src/components/Toolbar/DiagramCreateButton';


const messages = defineMessages({
  title: {
    id: 'diagrams.title',
    defaultMessage: 'Network diagrams',
  },
  no_results_title: {
    id: 'diagrams.no_results_title',
    defaultMessage: 'You do not have any network diagrams yet',
  },
});

export class DiagramsIndexScreen extends Component {
  // constructor(props) {
  //   super(props);
  // }

  componentDidMount() {
    this.fetchIfNeeded();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  fetchIfNeeded() {
    const { diagrams } = this.props;
    if (!diagrams || diagrams.shouldLoad) {
      this.props.fetchRoleDiagrams();
    }
  }

  render() {
    const { diagrams, intl } = this.props;

    console.log(diagrams);

    const breadcrumbs = (
      <Breadcrumbs>
        <li>
          <FormattedMessage
            id="cases.browser.breadcrumb"
            defaultMessage="Diagrams"
          />
        </li>
      </Breadcrumbs>
    );

    return (
      <Screen
        className="DiagramsIndexScreen"
        breadcrumbs={breadcrumbs}
        title={intl.formatMessage(messages.title)}
        requireSession
      >
        <Dashboard>
          <div className="Dashboard__title-container">
            <div className="Dashboard__actions">
              <DiagramCreateButton />
            </div>
            <h5 className="Dashboard__title">{intl.formatMessage(messages.title)}</h5>
            <p className="Dashboard__subheading">
              <FormattedMessage
                id="diagram.description"
                defaultMessage="Network diagrams let you visualize complex relationships within a dataset."
              />
            </p>
          </div>
        </Dashboard>
      </Screen>
    );
  }
}

const mapStateToProps = () => {
  console.log('hello');
  return {
    // diagrams: selectRoleDiagrams(state),
  };
};


export default compose(
  connect(mapStateToProps, { fetchRoleDiagrams }),
  injectIntl,
)(DiagramsIndexScreen);
