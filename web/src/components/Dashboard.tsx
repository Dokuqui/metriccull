/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding: 60px 20px;
  background: radial-gradient(circle at top left, #1a1c2e, #0f1115);
  min-height: 100vh;
  width: 100%;
  color: #e2e8f0;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentWrapper = styled.div`
  max-width: 1000px;
  width: 100%;
`;

const Header = styled.header`
  margin-bottom: 50px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 24px;
`;

const TitleGroup = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(to right, #ffffff, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.05em;
  }
  p {
    color: #64748b;
    font-size: 0.9rem;
    margin-top: 4px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 12px;
  background: rgba(30, 41, 59, 0.4);
  padding: 8px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Input = styled.input`
  background: transparent;
  border: none;
  color: white;
  padding: 8px 16px;
  width: 350px;
  outline: none;
  font-family: inherit;
  &::placeholder {
    color: #475569;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const Card = styled.div`
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  padding: 32px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-5px);
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(99, 102, 241, 0.4);
  }
`;

const Label = styled.p`
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
`;

const Value = styled.h2`
  font-size: 2.25rem;
  font-weight: 800;
  color: #f8fafc;
  display: flex;
  align-items: baseline;
  gap: 8px;

  span {
    font-size: 1rem;
    color: #64748b;
    font-weight: 500;
  }
`;

const Button = styled.button`
  background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: scale(1.02);
  }
  &:disabled {
    background: #1e293b;
    color: #64748b;
    cursor: not-allowed;
  }
`;

const ErrorPanel = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  padding: 24px;
  border-radius: 16px;
  color: #f87171;
  margin-bottom: 24px;
  animation: ${fadeIn} 0.4s ease-out;

  pre {
    background: rgba(0, 0, 0, 0.2);
    padding: 12px;
    border-radius: 8px;
    margin-top: 10px;
    font-size: 0.8rem;
    overflow-x: auto;
  }
`;

const InsightPanel = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border-radius: 20px;
  padding: 32px;
  border: 1px solid rgba(245, 158, 11, 0.2);
`;

const InsightTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f59e0b;
  }
`;

const SuggestionItem = styled.div`
  background: rgba(15, 23, 42, 0.5);
  padding: 16px;
  border-radius: 12px;
  margin-top: 12px;
  color: #cbd5e1;
`;

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState(
    "https://github.com/lucas-mancini/python-pi-benchmark",
  );

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

  const runProfile = async () => {
    setData(null); // Clear old data/errors
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl }),
      });
      const result = await res.json();
      console.log("Backend Response:", result);
      setData(result);
    } catch (err) {
      console.error("Failed to fetch", err);
      setData({
        error: "Network Error",
        details: "Check if the Go backend is running and CORS is allowed.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <ContentWrapper>
        <Header>
          <TitleGroup>
            <h1>MetricCull</h1>
            <p>Advanced Performance Profiling Engine</p>
          </TitleGroup>
          <InputGroup>
            <Input
              placeholder="GitHub Repo URL..."
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
            <Button onClick={runProfile} disabled={loading}>
              {loading ? "Profiling..." : "Analyze Repo"}
            </Button>
          </InputGroup>
        </Header>

        {/* ERROR HANDLING */}
        {data?.error && (
          <ErrorPanel>
            <strong>Backend Error:</strong> {data.error}
            {data.details && <pre>{data.details}</pre>}
          </ErrorPanel>
        )}

        {/* SUCCESS STATE */}
        {data?.metrics && (
          <>
            <StatsGrid>
              <Card>
                <Label>Peak Memory</Label>
                <Value>
                  {((data.metrics?.peak_memory_kb || 0) / 1024).toFixed(2)}{" "}
                  <span>MB</span>
                </Value>
              </Card>
              <Card>
                <Label>Execution Time</Label>
                <Value>
                  {data.metrics?.total_time_ms || 0} <span>ms</span>
                </Value>
              </Card>
              <Card>
                <Label>AI Performance Score</Label>
                <Value
                  style={{
                    color: data.analysis?.score === "A" ? "#10b981" : "#f59e0b",
                  }}
                >
                  {data.analysis?.score || "N/A"}
                </Value>
              </Card>
            </StatsGrid>

            <InsightPanel>
              <InsightTitle>
                <h3>AI Logic Analysis</h3>
              </InsightTitle>
              {data.analysis?.suggestions?.map((s: string, i: number) => (
                <SuggestionItem key={i}>{s}</SuggestionItem>
              ))}
            </InsightPanel>
          </>
        )}
      </ContentWrapper>
    </Container>
  );
}
