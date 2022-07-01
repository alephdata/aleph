import React, { PureComponent } from 'react';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';

import AuthenticationDialog from 'dialogs/AuthenticationDialog/AuthenticationDialog';
import { selectSession, selectMetadata } from 'selectors';

import './ErrorSection.scss';

export class ErrorSection extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
    this.onSignIn = this.onSignIn.bind(this);
  }

  componentDidMount() {
    const { error, session } = this.props;
    const statusCode = get(error, 'response.status');
    if ((statusCode === 401 || statusCode === 403) && !session.loggedIn) {
      this.onSignIn();
    }
  }

  onSignIn() {
    this.setState(({ isOpen }) => ({ isOpen: !isOpen }));
  }

  render() {
    const { error, metadata } = this.props;
    const { isOpen } = this.state;
    const { title = '', description = '', icon = 'error' } = this.props;
    const message = error === undefined ? title : error.message;

    return (
      <>
        <AuthenticationDialog
          auth={metadata.auth}
          nextPath={window.location.href}
          isOpen={isOpen}
          toggleDialog={this.onSignIn}
        />
        <div className="ErrorSection">
          <div className="inner-div">
            <NonIdealState
              icon={icon}
              title={message}
              description={description}
            />
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => ({
  metadata: selectMetadata(state),
  session: selectSession(state),
});

export default connect(mapStateToProps)(ErrorSection);
