import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import AssetDetails from "@/components/asset/asset-details";

type Asset = Doc<"assets">;

export default async function AssetPage({ params }: { params: { id: string } }) {
  // Convert the string ID to a Convex ID
  const assetId = params.id as Id<"assets">;
  
  // Preload asset data
  const asset = (await preloadQuery(api.assets.getAsset, { id: assetId }))._valueJSON as unknown as Asset;

  return (
    <div className="container mx-auto px-4 py-8">
      <main>
        <AssetDetails asset={asset} />
      </main>
    </div>
  );
} 