import React, {Component} from 'react';
import {connect} from 'react-redux';
import queryString from 'query-string';
import {fetchStatistics} from '../../actions/index';
import {injectIntl, FormattedMessage, FormattedNumber} from 'react-intl';

import Screen from '../../components/common/Screen';
import CollectionBrowser from '../../components/CollectionScreen/CollectionBrowser';

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
        const { intl } = this.props;
        const countStats = this.props.statistics.count || 0;
        return (
            <Screen>
                <div className="HomePage">
                    <h1 className="search_h1">
                        <FormattedMessage id='home.search.title'
                                          defaultMessage="{count} leads"
                                          values={{
                                            count: (<FormattedNumber value={countStats} />)
                                          }} />
                    </h1>
                    <form onSubmit={this.onSubmit} className="search_form">
                        <div className="pt-input-group pt-large">
                            <span className="pt-icon pt-icon-search search_span"/>
                            <input className="pt-input search_input"
                                type="search"
                                placeholder={intl.formatMessage({id: 'home.search.placeholder', defaultMessage: "Search companies, people and documents."})}
                                dir="auto"
                                onChange={this.onChange}
                                value={this.state.value}/>
                        </div>
                    </form>
                </div>
                <CollectionBrowser />
            </Screen>
        );
    }
}

const mapStateToProps = state => {
    return {
        collections: state.collections,
        statistics: state.statistics
    };
};

HomeScreen = injectIntl(HomeScreen)
export default connect(mapStateToProps, {fetchStatistics})(HomeScreen);
