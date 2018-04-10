import React from 'react';
import { withRouter } from 'react-router';
import { Button } from '@blueprintjs/core';

import Fragment from 'src/app/Fragment';

class CloseButton extends React.Component {
    constructor(props) {
        super(props);
        this.close = this.close.bind(this);
    }

    close() {
        const { history: hist } = this.props;
        const fragment = new Fragment(hist);
        fragment.update({'preview:id': null});
    }

    render() {
        return (
            <Button className="pt-minimal button-close" icon="cross" onClick={this.close}/>
        );
    }
}

CloseButton = withRouter(CloseButton);

export default CloseButton