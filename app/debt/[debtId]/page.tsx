import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import DebtDetails from "@/components/debt/debt-details";

type Debt = Doc<"debts">;

export default async function DebtPage({ params }: { params: { debtId: string } }) {
  // Convert the string ID to a Convex ID
  const debtId = params.debtId as Id<"debts">;
  
  // Preload debt data
  const debt = (await preloadQuery(api.debts.getDebt, { id: debtId }))._valueJSON as unknown as Debt;

  return (
    <div className="container mx-auto px-4 py-8">
      <main>
        <DebtDetails debt={debt} />
      </main>
    </div>
  );
} 