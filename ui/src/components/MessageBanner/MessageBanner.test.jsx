import { render, screen } from 'testUtils';
import MessageBanner from './MessageBanner';

const getCallout = (container, intent) => {
  return container.querySelector(
    `[class*="-callout"][class*="-intent-${intent}"]`
  );
};

const getTime = (container, date) => {
  return container.querySelector(`time[datetime="${date}"]`);
};

it('renders empty wrapper without message', () => {
  // This ensures that the ARIA live region is already present in the DOM,
  // even if no message is displayed. Required by some screenreaders so that
  // they announce new messages correctly.
  render(<MessageBanner message={null} />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});

it('renders level, title, body, date', () => {
  const message = {
    title: 'Degraded ingest performance',
    safeHtmlBody:
      'Processing ingested files currently takes longer than usual.',
  };

  render(<MessageBanner message={message} />);
  expect(screen.getByText('Degraded ingest performance')).toBeInTheDocument();
  expect(screen.getByText(message.safeHtmlBody)).toBeInTheDocument();
});

it('renders HTML body', () => {
  const message = {
    safeHtmlBody: '<a href="https://example.org">Read more</a>',
  };

  render(<MessageBanner message={message} />);
  expect(screen.getByText('Read more')).toBeInTheDocument();
  expect(screen.getByText('Read more').closest('a')).toHaveAttribute(
    'href',
    'https://example.org'
  );
});

it('renders correct intent', () => {
  const { container } = render(<MessageBanner message={{ level: 'info' }} />);
  expect(getCallout(container, 'primary')).toBeInTheDocument();
});

it('uses warning intent by default', () => {
  const { container } = render(<MessageBanner message={{}} />);
  expect(getCallout(container, 'warning')).toBeInTheDocument();
});

it('renders date', () => {
  const message = {
    safeHtmlBody: 'Hello World!',
    createdAt: '2022-01-01T00:00:00.000Z',
  };

  const { container } = render(<MessageBanner message={message} />);
  expect(getTime(container, message.createdAt)).toBeInTheDocument();
});

it('renders successfully with only a body', () => {
  render(<MessageBanner message={{ safeHtmlBody: 'Hello World!' }} />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});

it('renders latest update', () => {
  const message = {
    safeHtmlBody: 'Aleph will be down for maintenance on Sunday.',
    createdAt: '2022-01-01T00:00:00.000Z',
    updates: [
      {
        createdAt: '2022-01-02T00:00:00.000Z',
        safeHtmlBody: 'We’re back online!',
      },
    ],
  };

  const { container } = render(<MessageBanner message={message} />);
  expect(screen.getByRole('status')).toHaveTextContent('We’re back online!');
  expect(getTime(container, message.createdAt));
});
