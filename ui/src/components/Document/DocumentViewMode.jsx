import _ from 'lodash';
import React from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import Query from 'src/app/Query';
// import { DocumentSearch } from 'src/components/Toolbar';
import DefaultViewer from 'src/viewers/DefaultViewer';
import TableViewer from 'src/viewers/TableViewer';
import TextViewer from 'src/viewers/TextViewer';
import HtmlViewer from 'src/viewers/HtmlViewer';
import PdfViewer from 'src/viewers/PdfViewer';
import ImageViewer from 'src/viewers/ImageViewer';
import FolderViewer from 'src/viewers/FolderViewer';
import EmailViewer from 'src/viewers/EmailViewer';

import './DocumentViewMode.css';


class DocumentViewMode extends React.Component {
  constructor(props) {
    super(props);
  }

  hasSchemata(schemata) {
    const { document } = this.props;
    return _.intersection(document.schemata, schemata).length > 0;
  }

  renderContent() {
    const { document, queryText, activeMode } = this.props;
    
    if (document.schema === 'Email') {
      return <EmailViewer document={document}
                          queryText={queryText}
                          activeMode={activeMode} />;
    } else if (document.schema === 'Table') {
      return <TableViewer document={document}
                          queryText={queryText} />;
    } else if (document.schema === 'Image') {
      return <ImageViewer document={document}
                          queryText={queryText}
                          activeMode={activeMode} />;
    } else if (document.text && !document.html) {
      return <TextViewer document={document}
                         queryText={queryText} />;
    } else if (document.html) {
      return <HtmlViewer document={document}
                         queryText={queryText} />;
    } else if (document.links && document.links.pdf) {
      return <PdfViewer document={document}
                        queryText={queryText}
                        activeMode={activeMode} />;
    } else if (document.schema === 'Folder' || document.schema === 'Package' || document.schema === 'Workbook') {
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
  const query = Query.fromLocation('search', location, {});
  return { queryText: query.getString('q') }
};

DocumentViewMode = connect(mapStateToProps)(DocumentViewMode);
DocumentViewMode = withRouter(DocumentViewMode);
export default DocumentViewMode;
