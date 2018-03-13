import React, { Component } from 'react';
import { connect } from 'react-redux';

import SectionLoading from 'src/components/common/SectionLoading';
import { DocumentToolbar } from 'src/components/Toolbar';

import './ImageViewer.css';

class ImageViewer extends Component {
  render() {
    const { document, session } = this.props;
    if (!document.links || !document.links.file) {
        return <SectionLoading />;
    }
    const imageUrl = session.token ? `${document.links.file}?api_key=${session.token}` : document.links.file;

    return (
      <React.Fragment>
        <DocumentToolbar document={document}/>
          <div className="ImageViewer">
            <img src={imageUrl} alt={document.file_name} />
          </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => ({
  session: state.session,
});

export default connect(mapStateToProps)(ImageViewer);
