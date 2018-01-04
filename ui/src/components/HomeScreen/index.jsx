import React, {Component} from 'react';
import {connect} from 'react-redux';
import queryString from 'query-string';
import {fetchStatistics} from '../../actions/index';
import { FormattedNumber } from 'react-intl';

import Screen from '../../components/common/Screen';
import Breadcrumbs from '../../components/common/Breadcrumbs';

import './style.css';

class HomeScreen extends Component {
    constructor() {
        super();
        this.state = {value: ''};

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount() {
        if(!this.props.statistics.isLoaded) this.props.fetchStatistics();
    }

    onChange({target}) {
        this.setState({value: target.value})
    }

    onSubmit(event) {
        const {history} = this.props;
        history.push({
            pathname: '/search',
            search: queryString.stringify({
                q: this.state.value
            })
        });
        this.setState({value: ''});
        event.preventDefault();
    }

    render() {
        const samples = this.props.metadata.app.samples;
        const countStats = this.props.statistics.count;
        return (
            <Screen>
                <Breadcrumbs/>
                <div className="homepage_image">
                    <div className="search_subtitles">
                        <h1 className="search_h1">
                            <FormattedNumber value={countStats} />
                        </h1>
                    </div>
                    <form onSubmit={this.onSubmit} className="search_form">
                    <div className="pt-input-group .modifier .pt-large search_homepage">
                        <span className="pt-icon pt-icon-search search_span"/>
                        <input className="pt-input search_input"
                               type="search"
                               placeholder="Search input"
                               dir="auto"
                               onChange={this.onChange}
                               value={this.state.value}/>
                    </div>
                    </form>
                    <p className="homepage_examples">Examples: &nbsp; {samples.map(function(item){
                        return <p className="search_example_item">{item},&nbsp; </p>
                    })} <p> or browse sources.</p>
                    </p>
                </div>
            </Screen>
        );
    }
}

const mapStateToProps = state => {
    return {
        collections: state.collections,
        statistics: state.statistics,
        metadata: state.metadata
    };
};

export default connect(mapStateToProps, {fetchStatistics})(HomeScreen);
