import Dashboard from '@/components/Dashboard';

export default function Home() {
  const mockData = {
    peak_memory: 142.5,
    duration: 850,
  };

  return <Dashboard data={mockData} />;
}