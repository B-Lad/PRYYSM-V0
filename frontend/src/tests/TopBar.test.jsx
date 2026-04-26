import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopBar } from '../modules/TopBar';

describe('TopBar Component', () => {
    it('renders the application title', () => {
        render(<TopBar session={{ full_name: "Test User" }} />);
        expect(screen.getByText('Pryysm MES')).toBeInTheDocument();
        expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays the Live Data indicator', () => {
        render(<TopBar session={{ full_name: "Test User" }} />);
        expect(screen.getByText('Live Data')).toBeInTheDocument();
    });
});
