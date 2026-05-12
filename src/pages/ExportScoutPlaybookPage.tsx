import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

export const ExportScoutPlaybookPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const description = searchParams.get('description');

  console.log('[ExportScoutPlaybook TEST] Rendering for code:', code);

  return (
    <div style={{ padding: '50px', background: 'white', color: 'black', minHeight: '100vh', zIndex: 9999 }}>
      <h1>TEST PLAYBOOK PAGE</h1>
      <p>HS CODE: {code}</p>
      <p>DESCRIPTION: {description}</p>
      <button onClick={() => window.history.back()}>Go Back</button>
    </div>
  );
};

export default ExportScoutPlaybookPage;
