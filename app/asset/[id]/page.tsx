import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import AssetDetails from "@/components/asset/asset-details";
import { preloadQueryWithAuth } from "@/lib/convex";

type Asset = Doc<"assets">;

export default async function AssetPage({ params }: { params: { id: string } }) {
  // Convert the string ID to a Convex ID
  const assetId = params.id as Id<"assets">;
  
  // Preload asset data with authentication
  const asset = await preloadQueryWithAuth<Asset>(api.assets.getAsset, { id: assetId });

  return (
    <div className="container mx-auto px-4 py-8">
      <main>
        <AssetDetails asset={asset} />
      </main>
    </div>
  );
} 