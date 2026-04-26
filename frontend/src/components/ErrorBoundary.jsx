import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Component Error Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '24px', background: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', color: '#991b1b', margin: '16px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Something went wrong.</h2>
                    <p style={{ fontSize: '14px', marginBottom: '16px' }}>An error occurred while loading this section of the dashboard.</p>
                    <button 
                        onClick={() => this.setState({ hasError: false })}
                        style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Try Again
                    </button>
                    <pre style={{ marginTop: '16px', fontSize: '11px', background: '#fff', padding: '12px', borderRadius: '4px', overflowX: 'auto', border: '1px solid #fca5a5' }}>
                        {this.state.error?.toString()}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}
