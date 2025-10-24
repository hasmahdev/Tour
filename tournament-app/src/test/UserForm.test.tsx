import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import UserForm from '../pages/Admin/UserForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../hooks/useAuth';

const queryClient = new QueryClient();

describe('UserForm', () => {
  it('renders the form fields', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
            <UserForm onSuccess={() => {}} />
        </AuthProvider>
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });
});
