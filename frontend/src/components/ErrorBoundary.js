import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-600 bg-red-100 rounded-lg">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;