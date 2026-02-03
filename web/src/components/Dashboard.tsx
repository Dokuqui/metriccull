"use client";
import styled from "styled-components";

const Container = styled.div`
  padding: 60px;
  background-color: #0f1115;
  min-height: 100vh;
  width: 100%;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  margin-bottom: 40px;
  border-left: 4px solid #6366f1;
  padding-left: 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #ffffff;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: #1a1d23;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #2d3139;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: #6366f1;
  }
`;

const Label = styled.p`
  color: #94a3b8;
  font-size: 0.875rem;
  text-transform: uppercase;
  margin-bottom: 8px;
`;

const Value = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #6366f1;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Dashboard({ data }: { data: any }) {
  return (
    <Container>
      <Header>
        <Title>MetricCull Performance Report</Title>
        <p>Project: github.com/user/my-python-app</p>
      </Header>

      <StatsGrid>
        <Card>
          <Label>Peak Memory</Label>
          <Value>{data.peak_memory} MB</Value>
        </Card>
        <Card>
          <Label>Execution Time</Label>
          <Value>{data.duration} ms</Value>
        </Card>
        <Card>
          <Label>Status</Label>
          <Value style={{ color: "#10b981" }}>Pass</Value>
        </Card>
      </StatsGrid>
    </Container>
  );
}
