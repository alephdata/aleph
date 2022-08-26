import React from 'react';
import { render, screen } from '@testing-library/react';
import { Dialog } from './Dialog';

const renderDialog = (props: object = {}) => {
  return render(
    <Dialog
      icon="info-sign"
      title="Lorem Ipsum"
      isProcessing={false}
      isOpen={true}
      onClose={() => {
        /* no-op */
      }}
      {...props}
    >
      Hello World
    </Dialog>
  );
};

describe('<Dialog />', () => {
  it('renders correctly with no properties', () => {
    renderDialog();
    expect(screen.getByText('Hello World')).toBeInTheDocument();
    expect(document.body).toMatchSnapshot();
  });

  it('renders custom classes', () => {
    renderDialog({ className: 'my-dialog' });
    expect(document.body).toMatchSnapshot();
    expect(document.querySelectorAll('.my-dialog')).toHaveLength(1);
  });
});
