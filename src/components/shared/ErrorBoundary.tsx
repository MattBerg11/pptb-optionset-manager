import { Button } from "@fluentui/react-components";
import React from "react";

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
    constructor(props: React.PropsWithChildren) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo): void {
        console.error("[OptionSetManager] Render error:", error, info);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <h3>Something went wrong</h3>
                    <p>{this.state.error?.message}</p>
                    <Button size="small" onClick={() => this.setState({ hasError: false, error: null })}>
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
