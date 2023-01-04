import { render } from 'testUtils';
import UpdateStatus from './UpdateStatus';

it('renders success by default', () => {
  render(<UpdateStatus />);
  expect(document.body).toHaveTextContent('Saved');
});

it('supports "success" status', () => {
  render(<UpdateStatus status={UpdateStatus.SUCCESS} />);
  expect(document.body).toHaveTextContent('Saved');
});

it('supports "in progress" status', () => {
  render(<UpdateStatus status={UpdateStatus.IN_PROGRESS} />);
  expect(document.body).toHaveTextContent('Saving');
});

it('supports "error" status', () => {
  render(<UpdateStatus status={UpdateStatus.ERROR} />);
  expect(document.body).toHaveTextContent('Error saving');
});
