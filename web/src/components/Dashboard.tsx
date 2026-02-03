/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
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

const Button = styled.button`
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 20px;
  &:disabled {
    background: #312e81;
  }
`;

const SuggestionBox = styled.div`
  margin-top: 20px;
  padding: 20px;
  background: #1e293b;
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
`;

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: "internal-test" }),
      });
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>MetricCull Performance Report</Title>
        <Button onClick={runProfile} disabled={loading}>
          {loading ? "Analysing..." : "Run Performance Check"}
        </Button>
      </Header>

      {data && (
        <>
          <StatsGrid>
            <Card>
              <Label>Peak Memory</Label>
              <Value>
                {(data.metrics.peak_memory_kb / 1024).toFixed(2)} MB
              </Value>
            </Card>
            <Card>
              <Label>Execution Time</Label>
              <Value>{data.metrics.total_time_ms} ms</Value>
            </Card>
            <Card>
              <Label>AI Score</Label>
              <Value
                style={{
                  color: data.analysis.score === "A" ? "#10b981" : "#f59e0b",
                }}
              >
                {data.analysis.score}
              </Value>
            </Card>
          </StatsGrid>

          <SuggestionBox>
            <Label>AI Insights</Label>
            {data.analysis.suggestions.map((s: string, i: number) => (
              <p key={i} style={{ marginTop: "8px" }}>
                • {s}
              </p>
            ))}
          </SuggestionBox>
        </>
      )}
    </Container>
  );
}
