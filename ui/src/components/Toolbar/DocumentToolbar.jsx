import React from 'react';
import { withRouter } from 'react-router';
import { defineMessages, injectIntl } from 'react-intl';

import DownloadButton from './DownloadButton'
import PagingButtons from './PagingButtons'

import './DocumentToolbar.css';

const messages = defineMessages({
  default_placeholder: {
    id: 'document.default_placeholder',
    defaultMessage: 'Search document',
  }
});

class DocumentToolbar extends React.Component {
  constructor(props) {
    super(props);
    this.state = { queryText: props.queryText };

    this.onChangeQuery = this.onChangeQuery.bind(this);
    this.onSubmitSearch = this.onSubmitSearch.bind(this);
  }

  onChangeQuery({target}) {
    this.setState({queryText: target.value});
    if (this.props.onChangeQuery !== undefined) {
      this.props.onChangeQuery(target.value);
    }
  }

  onSubmitSearch(event) {
    event.preventDefault();
    if (this.props.onSubmitSearch !== undefined) {
      this.props.onSubmitSearch();
    }
  }
    
  render() {
    const { intl } = this.props;
    const defaultPlaceholder = intl.formatMessage(messages.default_placeholder);
    const queryPlaceholder = this.props.queryPlaceholder || defaultPlaceholder;
    const searchDisabled = this.props.onChangeQuery === undefined;

    let downloadLink
    // @TODO If email w/ attachments then pass them as array of download options
    if (this.props.document && this.props.document.links && this.props.document.links.file) {
      downloadLink = { name: '', url: this.props.document.links.file }
    }    

    return (
      <div className="DocumentToolbar">
        <PagingButtons pageNumber={this.props.pageNumber} pageTotal={this.props.pageTotal}/>
        <form onSubmit={this.onSubmitSearch} className="ToolbarSearchForm">
          <div className="pt-input-group">
            <span className="pt-icon pt-icon-search"></span>
            <input className="pt-input" type="search" dir="auto"
                   disabled={searchDisabled}
                   placeholder={queryPlaceholder}
                   onChange={this.onChangeQuery}
                   value={this.state.queryText} />
          </div>
        </form>
        <DownloadButton downloadLink={downloadLink} />
      </div>
    );
  }
}

DocumentToolbar = injectIntl(DocumentToolbar)
DocumentToolbar = withRouter(DocumentToolbar)
export default DocumentToolbar;