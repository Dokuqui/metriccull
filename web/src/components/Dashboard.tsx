/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import styled from "styled-components";
import Terminal from "./Terminal";
import MetricsGrid from "./MetricsGrid";

const Header = styled.header`
  margin-bottom: 50px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 24px;
  width: 100%;
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
  p { color: #64748b; font-size: 0.9rem; margin-top: 4px; }
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
  &::placeholder { color: #475569; }
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
  &:disabled { background: #1e293b; color: #64748b; cursor: not-allowed; }
  &:hover:not(:disabled) { transform: scale(1.02); }
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

const InsightPanel = styled.div`
  margin-top: 32px;
  background: linear-gradient(145deg, #1e293b, #0f172a);
  border-radius: 20px;
  padding: 32px;
  border: 1px solid rgba(245, 158, 11, 0.2);
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
  const [repoUrl, setRepoUrl] = useState("https://github.com/scivision/python-performance");
  const [logs, setLogs] = useState<string[]>([]);

  const startProfiling = () => {
    setData(null);
    setLogs(["Connecting to profiler..."]);
    setLoading(true);

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/stream-profile?repo_url=${encodeURIComponent(repoUrl)}`
    );

    eventSource.addEventListener("log", (e) => setLogs(prev => [...prev, e.data]));

    eventSource.addEventListener("complete", (e) => {
      setData(JSON.parse(e.data));
      eventSource.close();
      setLoading(false);
    });

    eventSource.onerror = () => {
      setLogs(prev => [...prev, "❌ Connection lost."]);
      eventSource.close();
      setLoading(false);
    };
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
            <Button onClick={startProfiling} disabled={loading}>
              {loading ? "Streaming Logs..." : "Analyze Repo"}
            </Button>
          </InputGroup>
        </Header>

        {(loading || logs.length > 0) && <Terminal logs={logs} />}

        {data?.metrics && (
          <div style={{ marginTop: '32px' }}>
            <MetricsGrid metrics={data.metrics} analysis={data.analysis} />

            <InsightPanel>
              <h3>AI Logic Analysis</h3>
              {data.analysis?.suggestions?.map((s: string, i: number) => (
                <SuggestionItem key={i}>{s}</SuggestionItem>
              ))}
            </InsightPanel>
          </div>
        )}
      </ContentWrapper>
    </Container>
  );
}
