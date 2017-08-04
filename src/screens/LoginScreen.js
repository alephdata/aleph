import React, {Component} from 'react';
import {connect} from 'react-redux'
import {FormattedMessage} from "react-intl";
import {getProviderLoginUrl} from "../utils/utils";
import {endpoint} from '../api';

class LoginScreen extends Component {
  state = {};

  selectProvider(provider) {
    if (provider.name === 'password') {
      this.setState({showPasswordLogin: true});
    } else {
      window.location.href = getProviderLoginUrl(provider);
    }
  }

  login(event) {
    event.preventDefault();
    const {session} = this.props;
    const provider = session.providers.find((p) => p.name === 'password');
    if (!provider) throw new Error("no password provider");

    const url = provider.login;
    const data = {
      email: this.emailElement.value,
      password: this.passwordElement.value
    };

    endpoint.post(url, data).then((res) => {
      console.log(res);
      // window.location.pathname = '/'; // TODO
    }).catch(e => {
      console.error(e); // TODO
    });
  }

  render() {
    const {session} = this.props;
    const {showPasswordLogin} = this.state;
    if (!session.providers) return <section>No Login Providers</section>;

    if (showPasswordLogin) {
      return <section>
        <form onSubmit={(e) => this.login(e)}>
          <label className="pt-label">
            <FormattedMessage id="login.email" defaultMessage="E-Mail address"/>
            <input className="pt-input" type="email" ref={(el) => this.emailElement = el}/>
          </label>
          <label className="pt-label">
            <FormattedMessage id="login.password" defaultMessage="Password"/>
            <input className="pt-input" type="password" ref={(el) => this.passwordElement = el}/>
          </label>
          <button type="submit" className="pt-button pt-intent-primary pt-icon-log-in">
            <FormattedMessage id="login.submit" defaultMessage="Log in"/>
          </button>
        </form>
      </section>
    }

    return <section>
      <div className="pt-button-group pt-vertical pt-align-left pt-large">
        {session.providers.map(provider => <p key={provider.name}>
          <button type="button" className="pt-button pt-intent-primary pt-icon-log-in"
                  onClick={() => this.selectProvider(provider)}>
            <FormattedMessage id="login.provider" defaultMessage="Sign in with {label}"
                              values={{label: provider.label}}/>
          </button>
        </p>)}
      </div>
    </section>
  }
}

const mapStateToProps = (state) => ({session: state.session});
export default connect(mapStateToProps)(LoginScreen);
