import React from 'react';
import classnames from 'classnames';

import './Preview.scss';


class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previewTop: 0,
    };
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    this.handleScroll();
  }

  componentDidUpdate() {
    this.handleScroll();
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  // @TODO Debounce this callback!
  handleScroll() {
    const { previewTop } = this.state;
    const navbarHeight = document.getElementById('Navbar').getBoundingClientRect().height;
    const scrollPos = window.scrollY;
    const nextPreviewTop = (scrollPos <= navbarHeight) ? navbarHeight - scrollPos : 0;

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

    if (nextPreviewTop === previewTop) return;

    this.setState({
      previewTop: nextPreviewTop,
    });
  }

  render() {
    const { maximised, hidden, children } = this.props;
    const { previewTop } = this.state;
    let className = 'Preview';

    if (hidden) {
      className = classnames('hidden', className);
    }

    // Only allow Preview to have be maximised for document previews
    if (maximised) {
      className = classnames('maximised', className);
    }

    return (
      <div id="Preview" className={className} style={{ top: previewTop }}>
        {children}
      </div>
    );
  }
}

export default Preview;
