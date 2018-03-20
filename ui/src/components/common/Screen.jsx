import React from 'react';
import {withRouter} from 'react-router';
import {connect} from 'react-redux';
import {Helmet} from 'react-helmet';
import c from 'classnames';

import {Navbar} from 'src/components/Navbar';
import Preview from "src/components/Preview";
import Footer from "../Footer/Footer";

import './Screen.css';

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
    const {isHomepage, className, metadata, breadcrumbs} = this.props;
    let mainClass = isHomepage ? 'main-homepage' : 'main';
    let main;

    return (
      <div className={c("Screen", className)}>
        <Helmet titleTemplate={`%s - ${this.props.title || metadata.app.title}`}>
          <title>{this.props.title || metadata.app.title}</title>
          <link rel="shortcut icon" href={metadata.app.favicon}/>
        </Helmet>

        <Navbar metadata={metadata}
                session={this.props.session}
                query={this.props.query}
                updateQuery={this.props.updateQuery}
                isHomepage={isHomepage} />

        <main className={mainClass}>
          {this.props.children}
        </main>
          
        <Preview/>

        <Footer isHomepage={isHomepage}
                metadata={metadata}
                breadcrumbs={breadcrumbs} />
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    metadata: state.metadata,
    session: state.session
  };
};

Screen = connect(mapStateToProps)(Screen);
Screen = withRouter(Screen);
export default Screen;
