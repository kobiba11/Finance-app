"use client";

import { useTransition } from "react";
import { createVoucher } from "app/actions/finance";
import AddVoucherSmartForm from "./add-voucher-smart-form";

type Props = {
  householdId: string;
  onSuccess?: () => void;
};

type SmartVoucherPayload = {
  title: string;
  brand: string;
  value: string;
  currency: string;
  expiresAt: string;
  code: string;
  redeemAt: string;
  redeemApp: string;
  directLink: string;
  notes: string;
  rawText: string;
  imageFile?: File | null;
};

export default function AddVoucherForm({ householdId, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();

  async function handleSubmitVoucher(payload: SmartVoucherPayload) {
    return new Promise<void>((resolve, reject) => {
      startTransition(async () => {
        try {
          await createVoucher({
            household_id: householdId,
            name: payload.title,
            company: payload.brand || undefined,
            value: Number(payload.value || 0),
            currency: payload.currency || "ILS",
            redeem_where: payload.redeemAt || undefined,
            redemption_platform: payload.redeemApp || undefined,
            redemption_url: payload.directLink || undefined,
            voucher_code: payload.code || undefined,
            expiry_date: payload.expiresAt || undefined,
            notes: payload.notes || undefined,
            source_text: payload.rawText || undefined,
            imageFile: payload.imageFile ?? null,
            status: "active",
          });

          onSuccess?.();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  return (
    <div className="space-y-4">
      <AddVoucherSmartForm
        onSubmitVoucher={handleSubmitVoucher}
        onClose={onSuccess}
      />

      {isPending && (
        <div className="text-center text-sm text-slate-500">שומר...</div>
      )}
    </div>
  );
}