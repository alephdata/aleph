import React from 'react';
import {withRouter} from 'react-router';
import {connect} from 'react-redux';
import {Helmet} from 'react-helmet';

import {Navbar} from 'src/components/Navbar';

import './Screen.css';
import Footer from "../Footer/Footer";

class Screen extends React.Component {

  componentDidMount() {
    window.scrollTo(0, 0);
  }

  componentDidUpdate(prevProps) {
    if (this.props.location && (this.props.location.pathname !== prevProps.location.pathname)) {
      window.scrollTo(0, 0);
    }
  }

  render() {
    const {isHomepage} = this.props;

    return (
      <div className="Screen">
        <Helmet titleTemplate={`%s - ${this.props.title || this.props.metadata.app.title}`}>
          <title>{this.props.title || this.props.metadata.app.title}</title>
          <link rel="shortcut icon" href={this.props.metadata.app.favicon}/>
        </Helmet>

        <Navbar metadata={this.props.metadata} session={this.props.session} searchContext={this.props.searchContext}/>

        <main className="main">
          {this.props.children}
        </main>

        <Footer isHomepage={isHomepage}/>
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return state;
};

Screen = connect(
  mapStateToProps
)(Screen);

Screen = withRouter(Screen);

export default Screen;
