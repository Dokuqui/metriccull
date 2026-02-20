import styled from "styled-components";

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #1e293b;
  width: 90%;
  max-width: 600px;
  border-radius: 24px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

const DiffGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-top: 24px;
`;

const DiffCard = styled.div<{ $improved: boolean }>`
  background: rgba(30, 41, 59, 0.5);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid ${props => props.$improved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  
  h4 { color: #94a3b8; font-size: 0.8rem; margin-bottom: 8px; text-transform: uppercase; }
  .value { font-size: 1.5rem; font-weight: 800; color: #f8fafc; }
  .delta { 
    font-size: 0.9rem; 
    font-weight: 700; 
    color: ${props => props.$improved ? '#10b981' : '#ef4444'};
    margin-top: 4px;
  }
`;

const VersionBadge = styled.span`
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: monospace;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ComparisonOverlay({ runs, onClose }: { runs: any[], onClose: () => void }) {
    const [runA, runB] = runs;

    const calculateDelta = (valA: number, valB: number) => {
        const diff = valB - valA;
        const percent = ((diff / valA) * 100).toFixed(1);
        return { diff, percent, improved: diff <= 0 };
    };

    const timeDelta = calculateDelta(runA.total_time_ms, runB.total_time_ms);
    const memDelta = calculateDelta(runA.peak_memory_kb, runB.peak_memory_kb);

    return (
        <Overlay onClick={onClose}>
            <Modal onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '8px' }}>Performance Delta</h2>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Baseline (A)</span>
                        <VersionBadge>{runA.version || 'python3'}</VersionBadge>
                    </div>
                    <span style={{ color: '#64748b', fontWeight: 'bold' }}>VS</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase' }}>Target (B)</span>
                        <VersionBadge style={{ color: '#6366f1', background: 'rgba(99, 102, 241, 0.1)' }}>
                            {runB.version || 'python3'}
                        </VersionBadge>
                    </div>
                </div>

                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '20px' }}>
                    {runA.repo_url.split('/').pop()}
                </p>

                <DiffGrid>
                    <DiffCard $improved={timeDelta.improved}>
                        <h4>Execution Time</h4>
                        <div className="value">{runB.total_time_ms}ms</div>
                        <div className="delta">
                            {timeDelta.improved ? '↓' : '↑'} {Math.abs(Number(timeDelta.percent))}%
                        </div>
                    </DiffCard>

                    <DiffCard $improved={memDelta.improved}>
                        <h4>Peak Memory</h4>
                        <div className="value">{(runB.peak_memory_kb / 1024).toFixed(2)} MB</div>
                        <div className="delta">
                            {memDelta.improved ? '↓' : '↑'} {Math.abs(Number(memDelta.percent))}%
                        </div>
                    </DiffCard>
                </DiffGrid>

                <button
                    onClick={onClose}
                    style={{ marginTop: '32px', width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#334155', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                >
                    Close Comparison
                </button>
            </Modal>
        </Overlay>
    );
}
