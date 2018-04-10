import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import queryString from 'query-string';
import classnames from 'classnames';

import { PreviewEntity, PreviewCollection, PreviewDocument } from 'src/components/Preview/';

import './Preview.css';

class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previewTop: 0,
      previewBottom: 0,
    };
    this.handleScroll = this.handleScroll.bind(this);
    this.toggleMaximise = this.toggleMaximise.bind(this);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.handleScroll();
  }
  
  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  componentDidUpdate(prevProps) {
    this.handleScroll();
  }

  // @TODO Debounce this callback!
  handleScroll(event) {
    const navbarHeight = document.getElementById('Navbar').getBoundingClientRect().height;
    const footerHeight = document.getElementById('Footer').getBoundingClientRect().height;
    const scrollPos = window.scrollY;
    const previewTop = (scrollPos <= navbarHeight) ? navbarHeight - scrollPos : 0;
    const previewBottom = footerHeight;

    // @EXPERIMENTAL When enabled this adds right padding (equal to the width
    // of the Preview bar) any ContentPane elements on the page.
    // This is a working proof of concept but not intended as a feature yet.
    /*
    if (this.state.reflowContent === true) {
      setTimeout(() => {
        const previewWidth = document.getElementById('Preview').offsetWidth;
        [...document.getElementsByClassName("ContentPane")].forEach(
          (element, index, array) => {
            element.style.paddingRight = `${previewWidth + 20}px`;
          }
        );
      }, 500);
    }
    */
    
    if (previewTop === this.state.previewTop)
      return;
    
    this.setState({
      previewTop: previewTop,
      previewBottom: previewBottom
    })
  }
  
  toggleMaximise() {
    const { parsedHash, history, location } = this.props;
    parsedHash['preview:maximised'] = !this.props.maximised;
    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
    // @EXPERIMENTAL - Enable if content padding is enabled in handleScroll()
    // this.handleScroll();
  }
  
  render() {
    const { previewId, previewType, maximised } = this.props;
    const { previewTop, previewBottom } = this.state;
    let className = 'Preview';

    if (previewId === undefined || previewId === null) {
      return (
        <div id="Preview" className={classnames('hidden', className)} style={{
          top: previewTop,
          bottom: previewBottom
          }} />
      )
    }

    // Only allow Preview to have be maximised for document previews
    if (maximised === true && previewType === 'document') {
      className = classnames('maximised', className);
    }

    return (
      <div id="Preview" className={className} style={{
           top: previewTop,
           bottom: previewBottom
           }}>
        {previewType === 'entity' && (
          <PreviewEntity previewId={previewId} />
        )}
        {previewType === 'collection' && (
          <PreviewCollection previewId={previewId} />
        )}
        {previewType === 'document' && (
          <PreviewDocument previewId={previewId}
                           maximised={maximised}
                           toggleMaximise={this.toggleMaximise} />
        )}
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const parsedHash = queryString.parse(ownProps.location.hash);
  return {
    previewId: parsedHash['preview:id'],
    previewType: parsedHash['preview:type'],
    maximised: parsedHash['preview:maximised'] === 'true',
    parsedHash: parsedHash
  };
};

Preview = connect(mapStateToProps, {})(Preview);
Preview = withRouter(Preview);
export default Preview;