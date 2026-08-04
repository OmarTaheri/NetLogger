import DistributionDonut from './DistributionDonut';

interface Props {
  data: { name: string; count: number }[];
}

export default function OSPieChart({ data }: Props) {
  return <DistributionDonut data={data} ariaLabel="Top operating system distribution" accentOffset={1} />;
}
