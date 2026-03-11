/* eslint-disable @typescript-eslint/no-explicit-any */
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styled from 'styled-components';

const ChartPanel = styled.div`
  background: rgba(15, 23, 42, 0.4);
  border-radius: 20px;
  border: 1px solid rgba(99, 102, 241, 0.1);
  padding: 20px;
  height: 220px;
  margin-bottom: 20px;
`;

const formatTime = (label: any) => {
    if (!label) return '';
    const date = new Date(label);

    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');

    return `${h}:${m}:${s}`;
};

export default function LiveChart({ data }: { data: any[] }) {
    return (
        <ChartPanel>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis hide dataKey="time" />
                    <YAxis
                        stroke="#475569"
                        fontSize={11}
                        tickFormatter={(value) => `${value}MB`}
                        width={45}
                    />
                    <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        labelFormatter={formatTime}
                    />
                    <Area
                        type="monotone"
                        dataKey="memory"
                        stroke="#6366f1"
                        fillOpacity={1}
                        fill="url(#colorMem)"
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </ChartPanel>
    );
}