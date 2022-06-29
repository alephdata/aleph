{/*
SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.

SPDX-License-Identifier: MIT
*/}


import React, { Component } from 'react';
import c from 'classnames';


import './EntityDecisionRow.scss';

class EntityDecisionRow extends Component {
  constructor(props) {
    super(props);
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

  render() {
    const { className, children, selected } = this.props;

    return (
      <tr className={c("EntityDecisionRow", className, { selected })} ref={this.ref}>
        {children}
      </tr>
    );
  }
}

export default EntityDecisionRow;
