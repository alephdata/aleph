import React from 'react';
import {withRouter} from 'react-router';
import {connect} from 'react-redux';

import Query from 'src/app/Query';
import Schema from 'src/followthemoney/schema.ts';
// import { DocumentSearch } from 'src/components/Toolbar';
import DefaultViewer from 'src/viewers/DefaultViewer';
import TableViewer from 'src/viewers/TableViewer';
import TextViewer from 'src/viewers/TextViewer';
import HtmlViewer from 'src/viewers/HtmlViewer';
import PdfViewer from 'src/viewers/PdfViewer';
import ImageViewer from 'src/viewers/ImageViewer';
import FolderViewer from 'src/viewers/FolderViewer';
import EmailViewer from 'src/viewers/EmailViewer';

import './DocumentViewMode.scss';


class DocumentViewMode extends React.Component {
  renderContent() {
    const { document, queryText, activeMode } = this.props;
    if (Schema.hasSchemata(document, ['Email'])) {
      if (activeMode === 'browse') {
        return <FolderViewer document={document}
                             queryText={queryText} />;
      }
      return <EmailViewer document={document}
                          queryText={queryText}
                          activeMode={activeMode} />;
    }
    if (Schema.hasSchemata(document, ['Image'])) {
      if (activeMode === 'text') {
        return <TextViewer document={document}
                           queryText={queryText} />;
      }
      return <ImageViewer document={document}
                          queryText={queryText}
                          activeMode={activeMode} />;
    }
    if (Schema.hasSchemata(document, ['Table'])) {
      return <TableViewer document={document}
                          queryText={queryText} />;
    }
    if (Schema.hasSchemata(document, ['PlainText'])) {
      return <TextViewer document={document}
                         queryText={queryText} />;
    }
    if (Schema.hasSchemata(document, ['HyperText'])) {
      return <HtmlViewer document={document}
                         queryText={queryText} />;
    }
    if (Schema.hasSchemata(document, ['Pages'])) {
      return <PdfViewer document={document}
                        queryText={queryText}
                        activeMode={activeMode} />;
    }
    if (Schema.hasSchemata(document, ['Folder'])) {
      return <FolderViewer document={document}
                           queryText={queryText} />;
    }
    return <DefaultViewer document={document} queryText={queryText} />;
  }
  
  render() {
    const { document } = this.props;
    if (document.isLoading || document.shouldLoad) {
      return null;
    }

    return <div className='DocumentViewMode'>
      {this.renderContent()}
    </div>
  }
}

const mapStateToProps = (state, ownProps) => {
  const { location } = ownProps;
  const query = Query.fromLocation('search', location, {}, '');
  return {
    queryText: query.getString('q')
  }
};

DocumentViewMode = connect(mapStateToProps)(DocumentViewMode);
DocumentViewMode = withRouter(DocumentViewMode);
export default DocumentViewMode;
