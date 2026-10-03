'use client';
import React, { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/swagger')
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '2px solid #C9A84C',
        padding: '20px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C, #E0C77D)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: '1rem',
          color: '#0f172a',
          letterSpacing: '1px',
          flexShrink: 0,
        }}>
          KGN
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#E0C77D', letterSpacing: '1.5px' }}>
            KGN ASSOCIATES
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '1px' }}>
            Engineers and Valuers · REST API Documentation
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.4)',
            color: '#4ade80',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            ● API v1.0
          </span>
          <span style={{
            background: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.4)',
            color: '#C9A84C',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
          }}>
            OpenAPI 3.0
          </span>
        </div>
      </div>

      {/* Swagger UI Container */}
      {!spec ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div style={{ color: '#C9A84C', fontSize: '1rem', fontFamily: 'monospace' }}>
            Loading API documentation...
          </div>
        </div>
      ) : (
        <div id="swagger-wrapper">
          <SwaggerUI
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            displayRequestDuration={true}
            tryItOutEnabled={true}
          />
        </div>
      )}

      <style>{`
        /* Dark theme overrides for Swagger UI */
        #swagger-wrapper .swagger-ui {
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }
        #swagger-wrapper .swagger-ui .topbar { display: none; }
        #swagger-wrapper .swagger-ui .info { background: #1e293b; padding: 24px; border-radius: 12px; margin-bottom: 24px; border: 1px solid #334155; }
        #swagger-wrapper .swagger-ui .info .title { color: #C9A84C !important; }
        #swagger-wrapper .swagger-ui .info p, #swagger-wrapper .swagger-ui .info li { color: #94a3b8 !important; }
        #swagger-wrapper .swagger-ui .info code { background: #334155; color: #7dd3fc; padding: 2px 6px; border-radius: 4px; }
        #swagger-wrapper .swagger-ui .wrapper { background: #0f172a; padding: 24px; }
        #swagger-wrapper .swagger-ui .opblock-tag { border-bottom: 1px solid #334155; color: #e2e8f0; }
        #swagger-wrapper .swagger-ui .opblock-tag:hover { background: rgba(201,168,76,0.06); }
        #swagger-wrapper .swagger-ui .opblock { border-radius: 8px; border: 1px solid #334155; margin-bottom: 8px; background: #1e293b; }
        #swagger-wrapper .swagger-ui .opblock.opblock-post .opblock-summary { background: rgba(34,197,94,0.08); border-color: rgba(34,197,94,0.3); }
        #swagger-wrapper .swagger-ui .opblock.opblock-get .opblock-summary { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.3); }
        #swagger-wrapper .swagger-ui .opblock.opblock-put .opblock-summary { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.3); }
        #swagger-wrapper .swagger-ui .opblock.opblock-delete .opblock-summary { background: rgba(239,68,68,0.08); border-color: rgba(239,68,68,0.3); }
        #swagger-wrapper .swagger-ui .opblock-summary-description, .swagger-ui .opblock-summary-path { color: #cbd5e1 !important; }
        #swagger-wrapper .swagger-ui .opblock-body { background: #0f172a; }
        #swagger-wrapper .swagger-ui textarea, #swagger-wrapper .swagger-ui input[type=text] { background: #1e293b; color: #e2e8f0; border-color: #475569; border-radius: 6px; }
        #swagger-wrapper .swagger-ui .btn { border-radius: 6px; font-weight: 600; }
        #swagger-wrapper .swagger-ui .btn.execute { background: linear-gradient(135deg, #C9A84C, #E0C77D); color: #0f172a; border: none; }
        #swagger-wrapper .swagger-ui .btn.authorize { background: linear-gradient(135deg, #C9A84C, #E0C77D); color: #0f172a; border: none; }
        #swagger-wrapper .swagger-ui .scheme-container { background: #1e293b; border-bottom: 1px solid #334155; padding: 16px 24px; }
        #swagger-wrapper .swagger-ui section.models { background: #1e293b; border: 1px solid #334155; border-radius: 8px; }
        #swagger-wrapper .swagger-ui section.models .model-container { background: #0f172a; }
        #swagger-wrapper .swagger-ui .responses-table td { color: #cbd5e1; }
        #swagger-wrapper .swagger-ui table thead tr td, #swagger-wrapper .swagger-ui table thead tr th { color: #94a3b8; border-bottom: 1px solid #334155; }
        #swagger-wrapper .swagger-ui .parameter__name { color: #7dd3fc; }
        #swagger-wrapper .swagger-ui .parameter__type { color: #a78bfa; }
        #swagger-wrapper .swagger-ui .response-col_status { color: #4ade80; }
        #swagger-wrapper .swagger-ui .markdown p { color: #94a3b8; }
        #swagger-wrapper .swagger-ui select { background: #1e293b; color: #e2e8f0; border-color: #475569; border-radius: 6px; }
        #swagger-wrapper .swagger-ui .auth-wrapper { background: #1e293b; border: 1px solid #334155; border-radius: 8px; }
        #swagger-wrapper .swagger-ui .dialog-ux .modal-ux { background: #1e293b; border: 1px solid #C9A84C; border-radius: 12px; }
        #swagger-wrapper .swagger-ui .dialog-ux .modal-ux-header h3 { color: #C9A84C; }
        #swagger-wrapper .swagger-ui .dialog-ux .modal-ux-content label, #swagger-wrapper .swagger-ui .dialog-ux .modal-ux-content p { color: #cbd5e1; }
      `}</style>
    </div>
  );
}
