import React, { Component } from 'react';
import c from 'classnames';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { withRouter } from 'react-router';


import './EntityDecisionRow.scss';

class EntityDecisionRow extends Component {
  constructor(props) {
    super(props);
    this.onSelect = this.onSelect.bind(this);
    this.ref = React.createRef();
  }

  componentDidMount() {
    const { selected } = this.props;

    if (selected) {
      this.ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  componentDidUpdate(prevProps) {
    const { selected } = this.props;

    if (selected && !prevProps.selected) {
      this.ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }

  onSelect() {
    const { history, location, objId } = this.props;

    const parsedHash = queryString.parse(location.hash);
    parsedHash.selectedId = objId;

    history.replace({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const { className, children, selected } = this.props;

    return (
      <tr className={c("EntityDecisionRow", className, { selected })} ref={this.ref} onClick={this.onSelect} >
        {children}
      </tr>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location, objId } = ownProps;
  const parsedHash = queryString.parse(location.hash);

  return { selected: parsedHash.selectedId === objId };
}

export default compose(
  withRouter,
  connect(mapStateToProps),
)(EntityDecisionRow);
