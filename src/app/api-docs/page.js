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
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '3px solid #C9A84C',
        padding: '18px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9A84C, #E0C77D)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '0.95rem', color: '#0f172a',
          letterSpacing: '1px', flexShrink: 0,
        }}>KGN</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#E0C77D', letterSpacing: '1.5px' }}>
            KGN ASSOCIATES
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '1px' }}>
            Engineers and Valuers · REST API Documentation
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.5)', color: '#4ade80', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>● API v1.0</span>
          <span style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.5)', color: '#C9A84C', padding: '4px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700 }}>OpenAPI 3.0</span>
        </div>
      </div>

      {/* Swagger UI */}
      {!spec ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <div style={{ color: '#C9A84C', fontSize: '1rem', fontFamily: 'monospace' }}>Loading API documentation...</div>
        </div>
      ) : (
        <div id="swagger-wrapper">
          <SwaggerUI spec={spec} docExpansion="list" defaultModelsExpandDepth={1} displayRequestDuration={true} tryItOutEnabled={true} />
        </div>
      )}

      <style>{`
        #swagger-wrapper, #swagger-wrapper .swagger-ui {
          background: #ffffff !important;
          font-family: 'Inter', 'Segoe UI', sans-serif !important;
        }
        #swagger-wrapper .swagger-ui .topbar { display: none !important; }
        #swagger-wrapper .swagger-ui .wrapper { background: #ffffff !important; padding: 24px 32px !important; }

        #swagger-wrapper .swagger-ui .info {
          background: #f8fafc !important; border: 1px solid #e2e8f0 !important;
          border-left: 4px solid #C9A84C !important; border-radius: 10px !important;
          padding: 24px !important; margin-bottom: 28px !important;
        }
        #swagger-wrapper .swagger-ui .info .title { color: #0f172a !important; font-weight: 800 !important; }
        #swagger-wrapper .swagger-ui .info p, #swagger-wrapper .swagger-ui .info li { color: #475569 !important; }
        #swagger-wrapper .swagger-ui .info code { background: #e2e8f0 !important; color: #0f172a !important; padding: 2px 6px !important; border-radius: 4px !important; }

        #swagger-wrapper .swagger-ui .scheme-container { background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important; padding: 14px 32px !important; box-shadow: none !important; }

        #swagger-wrapper .swagger-ui .btn.authorize { background: linear-gradient(135deg,#C9A84C,#E0C77D) !important; color: #0f172a !important; border: none !important; font-weight: 700 !important; border-radius: 8px !important; box-shadow: 0 2px 8px rgba(201,168,76,0.3) !important; }
        #swagger-wrapper .swagger-ui .btn.execute { background: linear-gradient(135deg,#C9A84C,#E0C77D) !important; color: #0f172a !important; border: none !important; font-weight: 700 !important; border-radius: 6px !important; }

        #swagger-wrapper .swagger-ui .opblock-tag { color: #0f172a !important; border-bottom: 1px solid #e2e8f0 !important; font-weight: 700 !important; }
        #swagger-wrapper .swagger-ui .opblock-tag:hover { background: #f8fafc !important; }

        #swagger-wrapper .swagger-ui .opblock { border-radius: 8px !important; border: 1px solid #e2e8f0 !important; margin-bottom: 8px !important; background: #ffffff !important; box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important; }
        #swagger-wrapper .swagger-ui .opblock.opblock-post .opblock-summary { background: #f0fdf4 !important; border-color: #bbf7d0 !important; }
        #swagger-wrapper .swagger-ui .opblock.opblock-get .opblock-summary { background: #eff6ff !important; border-color: #bfdbfe !important; }
        #swagger-wrapper .swagger-ui .opblock.opblock-put .opblock-summary { background: #fffbeb !important; border-color: #fde68a !important; }
        #swagger-wrapper .swagger-ui .opblock.opblock-delete .opblock-summary { background: #fef2f2 !important; border-color: #fecaca !important; }
        #swagger-wrapper .swagger-ui .opblock-summary-description, #swagger-wrapper .swagger-ui .opblock-summary-path { color: #1e293b !important; }
        #swagger-wrapper .swagger-ui .opblock-body { background: #f8fafc !important; }

        #swagger-wrapper .swagger-ui textarea, #swagger-wrapper .swagger-ui input[type=text], #swagger-wrapper .swagger-ui input[type=email], #swagger-wrapper .swagger-ui input[type=password] { background: #ffffff !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; border-radius: 6px !important; }
        #swagger-wrapper .swagger-ui select { background: #ffffff !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; border-radius: 6px !important; }

        #swagger-wrapper .swagger-ui table thead tr td, #swagger-wrapper .swagger-ui table thead tr th { color: #475569 !important; border-bottom: 1px solid #e2e8f0 !important; background: #f8fafc !important; }
        #swagger-wrapper .swagger-ui .responses-table td, #swagger-wrapper .swagger-ui table tbody tr td { color: #334155 !important; border-bottom: 1px solid #f1f5f9 !important; }

        #swagger-wrapper .swagger-ui .parameter__name { color: #1d4ed8 !important; }
        #swagger-wrapper .swagger-ui .parameter__type { color: #7c3aed !important; }
        #swagger-wrapper .swagger-ui .response-col_status { color: #15803d !important; font-weight: 700 !important; }

        #swagger-wrapper .swagger-ui section.models { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 10px !important; }
        #swagger-wrapper .swagger-ui section.models .model-container { background: #ffffff !important; }
        #swagger-wrapper .swagger-ui .model-title { color: #0f172a !important; }
        #swagger-wrapper .swagger-ui .model { color: #334155 !important; }
        #swagger-wrapper .swagger-ui .prop-type { color: #7c3aed !important; }

        #swagger-wrapper .swagger-ui .dialog-ux .modal-ux { background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-top: 4px solid #C9A84C !important; border-radius: 12px !important; box-shadow: 0 20px 60px rgba(0,0,0,0.15) !important; }
        #swagger-wrapper .swagger-ui .dialog-ux .modal-ux-header { background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important; }
        #swagger-wrapper .swagger-ui .dialog-ux .modal-ux-header h3 { color: #0f172a !important; }
        #swagger-wrapper .swagger-ui .dialog-ux .modal-ux-content label, #swagger-wrapper .swagger-ui .dialog-ux .modal-ux-content p { color: #334155 !important; }
        #swagger-wrapper .swagger-ui .auth-container input { background: #ffffff !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; }

        #swagger-wrapper .swagger-ui .markdown p, #swagger-wrapper .swagger-ui .markdown li { color: #475569 !important; }
        #swagger-wrapper .swagger-ui .markdown code { background: #e2e8f0 !important; color: #0f172a !important; }

        /* ── Response / Code blocks – KEY FIX ── */
        #swagger-wrapper .swagger-ui .highlight-code,
        #swagger-wrapper .swagger-ui .microlight,
        #swagger-wrapper .swagger-ui pre,
        #swagger-wrapper .swagger-ui code,
        #swagger-wrapper .swagger-ui .response-col_description pre,
        #swagger-wrapper .swagger-ui .body-param__text,
        #swagger-wrapper .swagger-ui .curl,
        #swagger-wrapper .swagger-ui .request-url {
          background: #f1f5f9 !important;
          color: #0f172a !important;
          font-family: 'Consolas', 'Courier New', monospace !important;
          font-size: 0.82rem !important;
          line-height: 1.65 !important;
          border-radius: 8px !important;
          padding: 14px 16px !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
          overflow-wrap: break-word !important;
          overflow-x: auto !important;
          max-width: 100% !important;
        }

        /* JSON syntax colors in response body */
        #swagger-wrapper .swagger-ui .microlight .string { color: #15803d !important; }
        #swagger-wrapper .swagger-ui .microlight .number { color: #b45309 !important; }
        #swagger-wrapper .swagger-ui .microlight .boolean { color: #7c3aed !important; }
        #swagger-wrapper .swagger-ui .microlight .null { color: #dc2626 !important; }
        #swagger-wrapper .swagger-ui .microlight .key { color: #1d4ed8 !important; font-weight: 600 !important; }

        /* Curl command block */
        #swagger-wrapper .swagger-ui .curl-command {
          background: #1e293b !important;
          border-radius: 8px !important;
          padding: 2px !important;
        }
        #swagger-wrapper .swagger-ui .curl {
          background: #1e293b !important;
          color: #e2e8f0 !important;
          border-radius: 8px !important;
        }

        /* Request URL box */
        #swagger-wrapper .swagger-ui .request-url {
          background: #eff6ff !important;
          color: #1d4ed8 !important;
          border: 1px solid #bfdbfe !important;
          font-weight: 600 !important;
        }

        /* Response body wrapper */
        #swagger-wrapper .swagger-ui .responses-inner {
          padding: 12px !important;
          background: #ffffff !important;
        }
        #swagger-wrapper .swagger-ui .response-col_description .response-col_description__inner {
          background: #f8fafc !important;
          border-radius: 8px !important;
          padding: 12px !important;
          border: 1px solid #e2e8f0 !important;
        }

        /* Make body param textarea readable */
        #swagger-wrapper .swagger-ui .body-param__text {
          background: #ffffff !important;
          color: #0f172a !important;
          border: 1px solid #cbd5e1 !important;
          min-height: 180px !important;
        }

        /* Live response status */
        #swagger-wrapper .swagger-ui .live-responses-table .response-col_status {
          font-size: 1rem !important;
          font-weight: 800 !important;
          color: #15803d !important;
        }
      `}</style>
    </div>
  );
}
