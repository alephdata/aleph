import React, {Component} from 'react';
import {connect} from 'react-redux';
import {AnchorButton} from '@blueprintjs/core';
import {FormattedMessage, injectIntl} from 'react-intl';

import DualPane from 'src/components/common/DualPane';

import './CollectionEditInfo.css';

class CollectionEditInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      label: '',
      summary: '',
      countries: '',
      languages: ''
    }

  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collection.isFetching === undefined) {
      this.setState({
        label: nextProps.collection.label,
        summary: nextProps.collection.summary === null ? '' : nextProps.collection.summary});
    }
  }

  render() {
    const {collection, intl} = this.props;
    const {label, summary, countries, languages} = this.state;
    console.log(this.props.collection)

    return (
      <DualPane.InfoPane className="CollectionEditInfo">
        <h1>
          {collection === undefined ? '' : collection.label}
        </h1>
        <div>
          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.label" defaultMessage="Label"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.label",
                       defaultMessage: "Enter name of collection"
                     })}
                     dir="auto"
                     onChange={this.onChangeName}
                     value={label}/>
            </div>
          </div>
          <div>
            <div className='api_key_group'>
              <i className="fa fa-key" aria-hidden="true"/>
              <label className="pt-label api_key">
                Import ID
              </label>
            </div>
            <label className="pt-label api_key_label">
              kkslkslslsksjjs
            </label>
          </div>

          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.summary" defaultMessage="Summary"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.summart",
                       defaultMessage: "Enter summary of collection"
                     })}
                     dir="auto"
                     onChange={this.onChangeName}
                     value={summary}/>
            </div>
          </div>

          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.contact" defaultMessage="Contact"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.contact",
                       defaultMessage: "Enter name of contact"
                     })}
                     dir="auto"
                     onChange={this.onChangeName}
                     value={summary}/>
            </div>
          </div>

          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.countries" defaultMessage="Countries"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.countries",
                       defaultMessage: "Enter countries"
                     })}
                     dir="auto"
                     onChange={this.onChangeName}
                     value={countries}/>
            </div>
          </div>

          <div className="pt-form-group label_group">
            <div className='label_icon_group'>
              <i className="fa fa-id-card" aria-hidden="true"/>
              <label className="pt-label label_class">
                <FormattedMessage id="collection.edit.info.countries" defaultMessage="Languages"/>
              </label>
            </div>
            <div className="pt-form-content">
              <input className="pt-input input_class"
                     type="text"
                     placeholder={intl.formatMessage({
                       id: "collection.edit.info.placeholder.languages",
                       defaultMessage: "Enter languages"
                     })}
                     dir="auto"
                     onChange={this.onChangeName}
                     value={languages}/>
            </div>
          </div>

        </div>
      </DualPane.InfoPane>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
  }
};

export default connect(mapStateToProps)(injectIntl(CollectionEditInfo));
