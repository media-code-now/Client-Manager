import React, { useState, useEffect } from 'react';
import { getAccessToken, getUser } from '../utils/auth';

/**
 * Debug component to display current authentication token status
 * Remove this component in production
 */
export const TokenDebugger: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<{
    hasToken: boolean;
    tokenLength: number;
    tokenPrefix: string;
    isExpired: boolean;
    expiresAt: string;
    timeUntilExpiry: string;
    userEmail: string;
    userId: string;
  } | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      const token = getAccessToken();
      const user = getUser();

      if (!token) {
        setTokenInfo(null);
        return;
      }

      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const expiresAt = payload.exp * 1000;
          const now = Date.now();
          const isExpired = now > expiresAt;
          const timeRemaining = expiresAt - now;

          const formatTime = (ms: number): string => {
            if (ms < 0) return 'Expired';
            const hours = Math.floor(ms / (1000 * 60 * 60));
            const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}h ${minutes}m`;
          };

          setTokenInfo({
            hasToken: true,
            tokenLength: token.length,
            tokenPrefix: token.substring(0, 20) + '...',
            isExpired,
            expiresAt: new Date(expiresAt).toLocaleString(),
            timeUntilExpiry: formatTime(timeRemaining),
            userEmail: payload.email || user?.email || 'Unknown',
            userId: payload.id || payload.uuid || user?.uuid || 'Unknown',
          });
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    };

    checkToken();
    const interval = setInterval(checkToken, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  if (!tokenInfo && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          background: '#ef4444',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        ⚠️ No Token
      </button>
    );
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '20px',
          background: tokenInfo?.isExpired ? '#ef4444' : '#10b981',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '12px',
          fontWeight: 'bold',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {tokenInfo?.isExpired ? '⚠️' : '✅'} Token
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        background: 'white',
        border: `2px solid ${tokenInfo?.isExpired ? '#ef4444' : '#10b981'}`,
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
        maxWidth: '400px',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          🔍 Token Debug Info
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '0',
            color: '#666',
          }}
        >
          ✕
        </button>
      </div>

      {tokenInfo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <strong>Status:</strong>{' '}
            <span style={{ color: tokenInfo.isExpired ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
              {tokenInfo.isExpired ? '⚠️ EXPIRED' : '✅ Valid'}
            </span>
          </div>
          
          <div>
            <strong>User:</strong> {tokenInfo.userEmail}
          </div>
          
          <div>
            <strong>User ID:</strong> {tokenInfo.userId}
          </div>
          
          <div>
            <strong>Expires:</strong> {tokenInfo.expiresAt}
          </div>
          
          <div>
            <strong>Time Left:</strong>{' '}
            <span style={{ color: tokenInfo.isExpired ? '#ef4444' : '#10b981' }}>
              {tokenInfo.timeUntilExpiry}
            </span>
          </div>
          
          <div>
            <strong>Token Length:</strong> {tokenInfo.tokenLength} chars
          </div>
          
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
            <strong>Token Preview:</strong>
            <div
              style={{
                background: '#f3f4f6',
                padding: '4px 8px',
                borderRadius: '4px',
                marginTop: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tokenInfo.tokenPrefix}
            </div>
          </div>

          {tokenInfo.isExpired && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
              }}
            >
              <strong>Action Required:</strong> Please log in again to get a new token.
            </div>
          )}

          <button
            onClick={() => {
              const token = getAccessToken();
              if (token) {
                navigator.clipboard.writeText(token);
                alert('Token copied to clipboard!');
              }
            }}
            style={{
              marginTop: '8px',
              padding: '8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            📋 Copy Full Token
          </button>
        </div>
      ) : (
        <div style={{ color: '#ef4444' }}>
          <strong>⚠️ No token found!</strong>
          <p style={{ marginTop: '8px' }}>
            You need to log in to access this application.
          </p>
          <button
            onClick={() => (window.location.href = '/login')}
            style={{
              marginTop: '8px',
              padding: '8px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              width: '100%',
            }}
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenDebugger;
