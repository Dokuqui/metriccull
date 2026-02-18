import styled from "styled-components";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Label = styled.p`
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 12px;
`;

const Value = styled.h2`
  font-size: 2.25rem;
  font-weight: 800;
  color: #f8fafc;
  display: flex;
  align-items: baseline;
  gap: 8px;
  span { font-size: 1rem; color: #64748b; }
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function MetricsGrid({ metrics, analysis }: any) {
    return (
        <Grid>
            <Card>
                <Label>Peak Memory</Label>
                <Value>
                    {((metrics?.peak_memory_kb || 0) / 1024).toFixed(2)} <span>MB</span>
                </Value>
            </Card>
            <Card>
                <Label>Execution Time</Label>
                <Value>
                    {metrics?.total_time_ms || 0} <span>ms</span>
                </Value>
            </Card>
            <Card>
                <Label>AI Score</Label>
                <Value style={{ color: analysis?.score === "A" ? "#10b981" : "#f59e0b" }}>
                    {analysis?.score || "N/A"}
                </Value>
            </Card>
        </Grid>
    );
}