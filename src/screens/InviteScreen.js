import React, {Component} from 'react';
import {FormattedMessage, injectIntl} from "react-intl";
import {Button} from '@blueprintjs/core';
import {connect} from "react-redux";
import {xhrErrorToast} from "../components/XhrToast";
import Callout from "../components/Callout";
import messages from "../messages";
import {endpoint} from "../api";
import {Redirect} from "react-router";

class InviteScreen extends Component {
  state = {submitted: false};

  submit(event) {
    event.preventDefault();
    const data = {email: this.emailElement.value};

    endpoint.post('/roles/invite', data).then(() => {
      this.setState({submitted: true})
    }).catch(e => {
      console.log(e);
      xhrErrorToast(e.response, this.props.intl);
    });
  }

  render() {
    const {submitted} = this.state;
    const {metadata, intl, session} = this.props;

    if (session.loggedIn) {
      return <Redirect to="/"/>;
    }

    if (!metadata.auth.registration) {
      return <Callout modifier="warning"
                      title={intl.formatMessage(messages.invite.not_available.title)}
                      desc={intl.formatMessage(messages.invite.not_available.desc)}/>;
    }

    if (submitted) {
      return <Callout modifier="primary"
                      title={intl.formatMessage(messages.invite.submitted.title)}
                      desc={intl.formatMessage(messages.invite.submitted.desc)}/>
    }

    return <section>
      <form onSubmit={(e) => this.submit(e)}>
        <label className="pt-label">
          <FormattedMessage id="invite.email" defaultMessage="E-Mail address"/>
          <input className="pt-input" type="email" name="email" required ref={(el) => this.emailElement = el}/>
        </label>
        <Button iconName="log-in" type="submit">
          <FormattedMessage id="invite.submit" defaultMessage="Signup"/>
        </Button>
      </form>
    </section>
  }
}

const mapStateToProps = (state) => ({session: state.session, metadata: state.metadata});
export default connect(mapStateToProps)(injectIntl(InviteScreen));
