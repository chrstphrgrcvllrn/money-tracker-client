import { api } from "@/api/client";
import type { Holiday, OtEntry, OtSettings } from "@/lib/otPay";

export type CutoffRule = { from: string; to: string; cutoff: string }; // "YYYY-MM-DD", inclusive

// A labeled amount on one cutoff. `tax` is the payslip's actual withholding, if known.
export type CutoffAdjustment = { cutoff: string; label: string; gross: number; tax?: number };

export type OtPayState = {
  settings: OtSettings;
  holidays: Holiday[];
  entries: OtEntry[];
  cutoffs?: string[];
  cutoffRules?: CutoffRule[];
  cutoffAdjustments?: CutoffAdjustment[];
};

export const getOtPay = async (): Promise<OtPayState> => {
  const res = await api.get("/ot-pay");
  return res.data;
};

export const saveOtPay = async (state: OtPayState): Promise<OtPayState> => {
  const res = await api.put("/ot-pay", state);
  return res.data;
};
