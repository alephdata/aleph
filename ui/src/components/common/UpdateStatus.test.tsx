import { render, act } from 'testUtils';
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

it('shows message when browser is offline', async () => {
  render(<UpdateStatus />);
  expect(document.body).toHaveTextContent('Saved');

  jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

  await act(async () => {
    window.dispatchEvent(new Event('offline'));
  });

  expect(document.body).toHaveTextContent('Offline');

  jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);

  await act(async () => {
    window.dispatchEvent(new Event('online'));
  });

  expect(document.body).toHaveTextContent('Saved');
});
