import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-white dark:bg-[#112116] flex items-center justify-center p-4 text-center">
                    <div className="max-w-md w-full bg-red-50 dark:bg-red-900/10 p-8 rounded-3xl border border-red-100 dark:border-red-900/20">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
                            <AlertTriangle size={32} />
                        </div>

                        <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                            We encountered an unexpected error.
                        </p>

                        {this.state.error && (
                            <pre className="text-xs text-left bg-black/5 dark:bg-black/30 p-4 rounded-xl overflow-auto max-h-40 mb-6 text-red-600 dark:text-red-400 font-mono">
                                {this.state.error.toString()}
                            </pre>
                        )}

                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={18} />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
