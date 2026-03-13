import { Layout } from "@/components/Layout";

export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-2xl arena-gradient flex items-center justify-center mb-4">
          <span className="text-3xl">⚽</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Layout>
  );
}
