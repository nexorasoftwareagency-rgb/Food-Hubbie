// === src/components/active-trip/BillingSummary.tsx ===
import { formatCurrency } from "@/lib/utils";
import type { RiderOrder } from "@/types";

export function BillingSummary({ order }: { order: Pick<RiderOrder, "subtotal" | "discount" | "deliveryFee" | "total"> }) {
  return (
    <div className="border-y border-dashed border-border py-3 my-3">
      <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
        <span>Subtotal</span>
        <span>{formatCurrency(order.subtotal)}</span>
      </div>
      {!!order.discount && (
        <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
          <span>Discount</span>
          <span>-{formatCurrency(order.discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-[12px] text-muted-foreground mb-1.5">
        <span>Delivery Fee</span>
        <span>{formatCurrency(order.deliveryFee)}</span>
      </div>
      <div className="flex justify-between text-[14.5px] font-extrabold mt-2">
        <span>Total to Collect</span>
        <span>{formatCurrency(order.total)}</span>
      </div>
    </div>
  );
}
