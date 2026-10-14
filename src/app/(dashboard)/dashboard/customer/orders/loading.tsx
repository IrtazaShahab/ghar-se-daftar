import { CardListPageSkeleton } from "@/components/ui/page-skeletons";

export default function Loading() {
  return <CardListPageSkeleton label="Loading your orders" cards={3} />;
}
