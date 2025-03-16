import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import DebtDetails from "@/components/debt/debt-details";
import { preloadQueryWithAuth } from "@/lib/convex";

type Debt = Doc<"debts">;

export default async function DebtPage({
  params,
}: {
  params: Promise<{ debtId: string }>;
}) {
  // Get the debtId from params Promise
  const { debtId } = await params;
  
  // Convert the string ID to a Convex ID
  const debtIdObj = debtId as Id<"debts">;
  
  // Preload debt data with authentication
  const debt = await preloadQueryWithAuth<Debt>(api.debts.getDebt, { id: debtIdObj });

  return (
    <div className="container mx-auto px-4 py-8">
      <main>
        <DebtDetails debt={debt} />
      </main>
    </div>
  );
} 