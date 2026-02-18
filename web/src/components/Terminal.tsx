import { useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.div`
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 12px;
  padding: 16px;
  margin-top: 24px;
  font-family: 'Fira Code', monospace;
  height: 250px;
  overflow-y: auto;
  box-shadow: inset 0 0 15px rgba(0,0,0,0.5);
  animation: ${fadeIn} 0.5s ease-out;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
`;

const LogLine = styled.div`
  color: #d1d5db;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 4px;
  &::before { content: "> "; color: #6366f1; font-weight: bold; }
`;

export default function Terminal({ logs }: { logs: string[] }) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <Wrapper ref={scrollRef}>
            {logs.map((log, i) => (
                <LogLine key={i}>{log}</LogLine>
            ))}
        </Wrapper>
    );
}