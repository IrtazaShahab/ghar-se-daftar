"use client";

import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="container-gsd py-16 md:py-24">
            <div className="mx-auto max-w-md rounded-[28px] border border-border bg-white/70 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 size-10 text-danger" />
              <h2 className="font-serif text-2xl font-semibold">Something went wrong</h2>
              <p className="mt-2 text-muted">Please try refreshing the page or contact support.</p>
              <Button
                onClick={() => window.location.reload()}
                variant="primary"
                className="mt-6 w-full"
              >
                Refresh Page
              </Button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
