import React, { PureComponent } from 'react';
import { get } from 'lodash';
import { connect } from 'react-redux';
import { NonIdealState } from '@blueprintjs/core';

import AuthenticationDialog from 'src/dialogs/AuthenticationDialog/AuthenticationDialog';
import { selectSession, selectMetadata } from 'src/selectors';

import './ErrorSection.scss';


class ErrorSection extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {isOpen: false};
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
    this.setState({isOpen: !this.state.isOpen})
  }

  render() {
    const { error, metadata } = this.props;
    const { title = '', description = '', visual = 'error', resolver } = this.props;
    const message = error === undefined ? title : error.message;

    return (
      <React.Fragment>
        <AuthenticationDialog auth={metadata.auth}
                              nextPath={window.location.href}
                              isOpen={this.state.isOpen}
                              toggleDialog={this.onSignIn} />
        <div className='ErrorSection'>
          <div className='inner-div'>
            <NonIdealState action={resolver} visual={visual} title={message} description={description} />
          </div>
        </div>
      </React.Fragment>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    metadata: selectMetadata(state),
    session: selectSession(state)
  };
};

ErrorSection = connect(mapStateToProps)(ErrorSection);
export default ErrorSection;
