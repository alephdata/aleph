import React, {Component} from 'react';
import {connect} from 'react-redux';
import queryString from 'query-string';

import Screen from 'src/components/common/Screen';
import Breadcrumbs from 'src/components/common/Breadcrumbs';
import HomepageImage from '../../assets/europe_asia_dark.png';
import DualPane from 'src/components/common/DualPane';
import HomeInfo from './HomeInfo';
import HomeContent from './HomeContent';

import './style.css';

class HomeScreen extends Component {
    constructor() {
        super();
        this.state = {value: ''};

        this.onChange = this.onChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
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
        return (
            <Screen>
                <Breadcrumbs/>
                <div className="homepage_image">
                    <div className="search_subtitles">
                        <h1 className="search_h1">93,801,670 leads</h1>
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
                </div>
                {/*<DualPane>
          <HomeInfo {...this.props} />
          <HomeContent {...this.props} />
        </DualPane>*/}
            </Screen>
        );
    }
}

const mapStateToProps = state => {
    return {
        collections: state.collections,
    };
};

export default connect(mapStateToProps)(HomeScreen);
