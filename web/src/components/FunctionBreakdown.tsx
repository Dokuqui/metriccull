import styled from "styled-components";

const Panel = styled.div`
  margin-top: 32px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 24px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const Row = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
  &:last-child { border: none; }
`;

const Label = styled.div`
  font-size: 0.85rem;
  color: #f8fafc;
  font-family: monospace;
`;

const SubLabel = styled.div`
  font-size: 0.7rem;
  color: #64748b;
`;

const TimeBar = styled.div<{ percent: number }>`
  height: 6px;
  background: #6366f1;
  width: ${props => props.percent}%;
  border-radius: 3px;
  margin-top: 4px;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FunctionBreakdown({ profile }: { profile: any[] }) {
    if (!profile || profile.length === 0) return null;

    const sorted = [...profile]
        .filter(f =>
            !f.n.includes('<') &&
            !f.f.includes('~') &&
            !f.f.includes('frozen')
        )
        .sort((a, b) => b.t - a.t)
        .slice(0, 5);

    const maxTime = sorted[0]?.t || 1;

    return (
        <Panel>
            <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Hot Paths (Top Bottlenecks)</h3>
            <Table>
                <tbody>
                    {sorted.map((func, i) => (
                        <Row key={i}>
                            <td style={{ padding: '12px 0' }}>
                                <Label>{func.n}</Label>
                                <SubLabel>{func.f.split('/').pop()}:{func.l}</SubLabel>
                                <TimeBar percent={(func.t / maxTime) * 100} />
                            </td>
                            <td style={{ textAlign: 'right', color: '#94a3b8', fontSize: '0.9rem' }}>
                                {func.t.toFixed(4)}s
                            </td>
                        </Row>
                    ))}
                </tbody>
            </Table>
        </Panel>
    );
}