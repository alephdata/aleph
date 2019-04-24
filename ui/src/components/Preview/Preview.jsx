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
    if (nextPreviewTop === previewTop) return;

    this.setState({
      previewTop: nextPreviewTop,
    });
  }

  render() {
    const { hidden, children } = this.props;
    const { previewTop } = this.state;
    const className = classnames('Preview', { hidden });
    return (
      <div id="Preview" className={className} style={{ top: previewTop }}>
        {children}
      </div>
    );
  }
}

export default Preview;
