import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ToolInvocation } from '../components/chat/ToolInvocation';

describe('ToolInvocation component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly for a general tool invocation', () => {
    render(
      <ToolInvocation
        tool={{
          toolName: 'unknown_tool',
          state: 'running',
        }}
      />
    );

    expect(screen.getByText('unknown_tool')).toBeDefined();
    expect(screen.getByTestId('status-indicator-loading')).toBeDefined();
  });

  it('renders a success indicator when state is result', () => {
    render(
      <ToolInvocation
        tool={{
          toolName: 'unknown_tool',
          state: 'result',
          result: 'success',
        }}
      />
    );

    expect(screen.getByText('unknown_tool')).toBeDefined();
    expect(screen.getByTestId('status-indicator-success')).toBeDefined();
  });

  it('renders user-friendly message for str_replace_editor create command', () => {
    render(
      <ToolInvocation
        tool={{
          toolName: 'str_replace_editor',
          state: 'running',
          args: { command: 'create', path: '/components/Button.tsx' },
        }}
      />
    );

    expect(screen.getByText('Creating file: /components/Button.tsx')).toBeDefined();
  });

  it('renders user-friendly message for str_replace_editor str_replace command', () => {
    render(
      <ToolInvocation
        tool={{
          toolName: 'str_replace_editor',
          state: 'result',
          args: JSON.stringify({ command: 'str_replace', path: '/components/Button.tsx' }),
        }}
      />
    );

    expect(screen.getByText('Editing file: /components/Button.tsx')).toBeDefined();
  });

  it('renders user-friendly message for generic file modifier tool', () => {
    render(
      <ToolInvocation
        tool={{
          toolName: 'str_replace_editor',
          state: 'running',
          args: { path: '/app/page.tsx' },
        }}
      />
    );

    expect(screen.getByText('Modifying file: /app/page.tsx')).toBeDefined();
  });
});
