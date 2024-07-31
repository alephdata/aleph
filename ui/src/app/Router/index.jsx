import { Component } from 'react';
import { connect } from 'react-redux';

import { fetchMetadata, fetchMessages, dismissMessage } from 'actions';
import {
  selectSession,
  selectMetadata,
  selectMessages,
  selectPinnedMessage,
} from 'selectors';

import { Page } from './Components';
import PageState from './utils/PageState';

import './Router.scss';

const MESSAGES_INTERVAL = 15 * 60 * 1000; // every 15 minutes
const MAX_METADATA_REQUEST_ATTEMPTS = 5;
const DELAY_METADATA_REQUEST = 2000;

class Router extends Component {
  metadataTimeoutIntervals = [];

  constructor(props) {
    super(props);

    this.state = {
      metadataRequestAttempts: 0,
      pageState: PageState.Loading,
    };
  }

  componentDidMount() {
    this.fetchIfNeeded();
    this.setMessagesInterval();
  }

  componentDidUpdate() {
    this.fetchIfNeeded();
  }

  componentWillUnmount() {
    this.clearMessagesInterval();
  }

  fetchIfNeeded() {
    const { metadata, messages } = this.props;

    if (metadata.shouldLoad) {
      this.executeRetryPattern();
    }

    if (messages.shouldLoad) {
      this.fetchMessages();
    }
  }

  executeRetryPattern() {
    if (this.state.metadataRequestAttempts >= MAX_METADATA_REQUEST_ATTEMPTS) {
      return;
    }

    this.setState({
      metadataRequestAttempts: this.state.metadataRequestAttempts + 1,
    });

    const delay = this.state.metadataRequestAttempts * DELAY_METADATA_REQUEST;

    const functionRef = (metadataRequestAttempts) => {
      const { metadata } = this.props;

      if (!metadata.shouldLoad) {
        this.setState({
          pageState: PageState.Success,
        });

        this.metadataTimeoutIntervals.forEach((intervalId) => {
          clearInterval(intervalId);
        });

        return;
      }

      /**
       * The following line is responsible to send a request to update: this.props.metadata
       * The method uses redux bridge / action
       */
      this.props.fetchMetadata();

      const isLastAttempt =
        metadataRequestAttempts + 1 === MAX_METADATA_REQUEST_ATTEMPTS;

      if (isLastAttempt && this.props.metadata.isPending) {
        this.setState({
          pageState: PageState.SomethingIsWrong,
        });
      }
    };

    const intervalId = setTimeout(
      functionRef,
      delay,
      this.state.metadataRequestAttempts
    );
    this.metadataTimeoutIntervals.push(intervalId);
  }

  fetchMessages() {
    const { metadata } = this.props;

    if (metadata?.app?.messages_url) {
      this.props.fetchMessages(metadata.app.messages_url);
    }
  }

  setMessagesInterval() {
    const id = setInterval(() => this.executeRetryPattern(), MESSAGES_INTERVAL);
    this.setState(() => ({ messagesInterval: id }));
  }

  clearMessagesInterval() {
    if (this.state?.messagesInterval) {
      clearInterval(this.state.messagesInterval);
    }
  }

  render() {
    const { pinnedMessage, dismissMessage } = this.props;

    return (
      <Page
        pageState={this.state.pageState}
        pinnedMessage={pinnedMessage}
        dismissMessage={dismissMessage}
      />
    );
  }
}

const mapStateToProps = (state) => ({
  metadata: selectMetadata(state),
  messages: selectMessages(state),
  pinnedMessage: selectPinnedMessage(state),
  session: selectSession(state),
});

export default connect(mapStateToProps, {
  fetchMetadata,
  fetchMessages,
  dismissMessage,
})(Router);
