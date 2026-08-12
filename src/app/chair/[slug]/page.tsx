import { chairs } from "@/data/chairs";
import ChairContent from "./ChairContent";

export function generateStaticParams() {
  return chairs.map((c) => ({ slug: c.id }));
}

export default function ChairPage() {
  return <ChairContent />;
}
