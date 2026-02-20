import { useState } from "react";
import styled from "styled-components";

const ActionButton = styled.button`
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-right: 12px;

  &:hover { transform: scale(1.05); }
  &:disabled { background: #1e293b; color: #64748b; cursor: not-allowed; }
`;

const CheckboxTd = styled.td`
  padding: 16px 24px;
  text-align: center;
`;

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

const VersionBadge = styled.span`
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: monospace;
`;

export default function HistoryTable({ history, onClear, onCompare }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    history: any[],
    onClear: () => void,
    onCompare: (ids: string[]) => void
}) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : (prev.length < 2 ? [...prev, id] : prev)
        );
    };

    const handleCompareClick = () => {
        const runsToCompare = history.filter(run => selectedIds.includes(run.id));
        onCompare(runsToCompare);
    };

    return (
        <TableContainer>
            <HeaderRow>
                <TableTitle>Recent Profiling Runs</TableTitle>
                <div>
                    {selectedIds.length === 2 && (
                        <ActionButton onClick={handleCompareClick}>
                            Compare Selected (2)
                        </ActionButton>
                    )}
                    <ClearButton onClick={onClear}>Clear All History</ClearButton>
                </div>
            </HeaderRow>
            <Table>
                <thead>
                    <tr>
                        <Th style={{ textAlign: 'center' }}>Select</Th>
                        <Th>Repository</Th>
                        <Th>Version</Th>
                        <Th>Time</Th>
                        <Th>Memory</Th>
                        <Th>Score</Th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((run, i) => {
                        const time = run.total_time_ms ?? run.metrics?.total_time_ms ?? 0;
                        const memory = run.peak_memory_kb ?? run.metrics?.peak_memory_kb ?? 0;
                        const score = run.score ?? run.analysis?.score ?? 'N/A';

                        return (
                            <tr key={run.id || i}>
                                <CheckboxTd>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(run.id)}
                                        onChange={() => toggleSelect(run.id)}
                                        style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                                    />
                                </CheckboxTd>
                                <Td style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                    {run.repo_url ? run.repo_url.split('/').pop() : "Unknown"}
                                </Td>
                                <Td>
                                    <VersionBadge>{run.version || 'python3'}</VersionBadge>
                                </Td>
                                <Td>{time}ms</Td>
                                <Td>{memory > 0 ? (memory / 1024).toFixed(2) : "0.00"} MB</Td>
                                <Td>
                                    <ScoreBadge score={score}>
                                        {score}
                                    </ScoreBadge>
                                </Td>
                            </tr>
                        );
                    })}
                </tbody>
            </Table>
        </TableContainer>
    );
}
