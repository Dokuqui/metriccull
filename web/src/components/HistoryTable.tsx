import styled from "styled-components";

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 24px;
`;

const ClearButton = styled.button`
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
  }
`;

const TableContainer = styled.div`
  margin-top: 48px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  width: 100%;
`;

const TableTitle = styled.h3`
  padding: 24px;
  font-size: 1.25rem;
  color: #f8fafc;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  text-align: left;
`;

const Th = styled.th`
  padding: 16px 24px;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(30, 41, 59, 0.2);
`;

const Td = styled.td`
  padding: 16px 24px;
  color: #cbd5e1;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
`;

const ScoreBadge = styled.span<{ score: string }>`
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.75rem;
  background: ${props => props.score === 'A' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'};
  color: ${props => props.score === 'A' ? '#10b981' : '#f59e0b'};
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function HistoryTable({ history, onClear }: { history: any[], onClear: () => void }) {
    if (history.length === 0) return null;

    return (
        <TableContainer>
            <HeaderRow>
                <TableTitle>Recent Profiling Runs</TableTitle>
                <ClearButton onClick={onClear}>Clear All History</ClearButton>
            </HeaderRow>
            <Table>
                <thead>
                    <tr>
                        <Th>Repository</Th>
                        <Th>Time</Th>
                        <Th>Memory</Th>
                        <Th>Score</Th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((run, i) => (
                        <tr key={i}>
                            <Td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                {run.repo.split('/').pop()}
                            </Td>
                            <Td>{run.metrics.total_time_ms}ms</Td>
                            <Td>{(run.metrics.peak_memory_kb / 1024).toFixed(2)} MB</Td>
                            <Td><ScoreBadge score={run.analysis.score}>{run.analysis.score}</ScoreBadge></Td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </TableContainer>
    );
}
