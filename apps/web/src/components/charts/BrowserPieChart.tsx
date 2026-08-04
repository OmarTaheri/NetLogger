import DistributionDonut from './DistributionDonut';

interface Props {
  data: { name: string; count: number }[];
}

export default function BrowserPieChart({ data }: Props) {
  return <DistributionDonut data={data} ariaLabel="Top browser distribution" />;
}
