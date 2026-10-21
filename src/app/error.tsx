'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    // Log exception to console (and monitoring service e.g. Sentry in production)
    console.error('Unhandled Application Exception caught by root error boundary:', error);
  }, [error]);

  const handleReset = () => {
    setIsRetrying(true);
    try {
      reset();
    } finally {
      setTimeout(() => setIsRetrying(false), 500);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="card border-0 shadow-sm rounded-4 text-center p-4 p-md-5 mx-auto" style={{ maxWidth: '640px', width: '100%' }}>
        {/* Animated Brand Shield Icon */}
        <div className="d-flex justify-content-center mb-4">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{
              width: '84px',
              height: '84px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
            }}
          >
            <ShieldAlert size={44} strokeWidth={2} />
          </div>
        </div>

        {/* Heading */}
        <span className="badge rounded-pill bg-danger-subtle text-danger px-3 py-2 fw-semibold mb-3 align-self-center">
          Application Notice
        </span>
        <h1 className="h3 fw-bold text-dark mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
          Something went wrong
        </h1>
        <p className="text-muted fs-6 mb-4">
          We encountered an unexpected error while rendering this page. Our team has been notified. You can try refreshing the component or return to the safe home page.
        </p>

        {/* Action Buttons */}
        <div className="d-flex flex-column flex-sm-row gap-3 justify-content-center mb-4">
          <button
            type="button"
            onClick={handleReset}
            disabled={isRetrying}
            className="btn btn-dark fw-bold rounded-pill px-4 py-2 d-inline-flex align-items-center justify-content-center gap-2"
            style={{ minHeight: '44px' }}
          >
            <RefreshCw size={18} className={isRetrying ? 'spin-animation' : ''} />
            <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
          </button>

          <Link
            href="/"
            className="btn btn-outline-secondary fw-semibold rounded-pill px-4 py-2 d-inline-flex align-items-center justify-content-center gap-2"
            style={{ minHeight: '44px' }}
          >
            <Home size={18} />
            <span>Return to Store</span>
          </Link>
        </div>

        {/* Technical Details Accordion */}
        <div className="border-top pt-3 text-start">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-link text-decoration-none text-muted p-0 fs-13 d-flex align-items-center justify-content-between w-100"
          >
            <span className="d-inline-flex align-items-center gap-1">
              <AlertTriangle size={14} className="text-warning" />
              Technical Error Details
            </span>
            {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDetails && (
            <div className="mt-3 p-3 bg-white rounded-3 border font-monospace text-break fs-12 text-secondary">
              <div className="fw-bold text-danger mb-1">
                {error.name || 'Error'}: {error.message || 'Unknown runtime error occurred.'}
              </div>
              {error.digest && (
                <div className="text-muted mt-1">
                  <strong>Digest ID:</strong> {error.digest}
                </div>
              )}
              {error.stack && (
                <pre className="mt-2 text-muted mb-0" style={{ maxHeight: '160px', overflowY: 'auto', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .spin-animation {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .fs-12 {
          font-size: 12px !important;
        }
        .fs-13 {
          font-size: 13px !important;
        }
      `}</style>
    </div>
  );
}
