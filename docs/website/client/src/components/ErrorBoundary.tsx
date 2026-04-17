import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallback({ error }: { error: Error | null }) {
  const { messages: m } = useI18n();
  return (
    <div className="flex items-center justify-center min-h-screen p-8 bg-background">
      <div className="flex flex-col items-center w-full max-w-2xl p-8">
        <AlertTriangle
          size={48}
          className="text-destructive mb-6 flex-shrink-0"
        />

        <h2 className="text-xl mb-4">{m.errorBoundary.title}</h2>

        <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
          <pre className="text-sm text-muted-foreground whitespace-break-spaces">
            {error?.stack}
          </pre>
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            "bg-primary text-primary-foreground",
            "hover:opacity-90 cursor-pointer",
          )}
        >
          <RotateCcw size={16} />
          {m.errorBoundary.reload}
        </button>
      </div>
    </div>
  );
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
