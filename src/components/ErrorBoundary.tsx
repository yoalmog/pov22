import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message || String(error) };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isBleError = this.state.errorMsg.toLowerCase().includes("bluetooth") || 
                         this.state.errorMsg.toLowerCase().includes("ble");
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-black text-white">
          <h2 className="text-xl font-bold mb-4">
            {isBleError ? "Hardware Connection Lost" : "Something went wrong."}
          </h2>
          <p className="text-sm text-slate-400 mb-6">{this.state.errorMsg}</p>
          <div className="flex gap-4">
            <button
              className="px-4 py-2 bg-[#00b4d8] hover:bg-[#0096b4] rounded-xl text-white font-bold uppercase text-xs"
              onClick={() => {
                this.setState({ hasError: false, errorMsg: "" });
              }}
            >
              {isBleError ? "Reconnect" : "Try Again"}
            </button>
            <button
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold uppercase text-xs"
              onClick={() => window.location.reload()}
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

