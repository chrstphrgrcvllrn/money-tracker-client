import { useEffect, useState } from "react";
import type { Subscription, Payment } from "../types/subscription.type";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  updatePayment,
} from "../api/subscription";

import {
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

type SubType = "auto" | "manual";

const normalizeType = (type?: string): SubType =>
  type?.toLowerCase().trim() === "manual" ? "manual" : "auto";

const normalizeBilling = (billing?: string) => {
  const val = billing?.toLowerCase();
  if (val === "yearly") return "yearly";
  return "monthly"; // default fallback
};

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
};

const isThisYear = (date?: string) => {
  if (!date) return false;
  return new Date(date).getFullYear() === new Date().getFullYear();
};

export default function SubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    amount: "",
    billing: "monthly" as "monthly" | "yearly",
    type: "auto" as SubType,
    startDate: "",
  });

  const load = async () => {
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleExpand = (index: number) => {
    setExpanded((prev) => (prev === index ? null : index));
  };

  const mask = (value: number) =>
    "*".repeat(value.toLocaleString().length);

  const resetForm = () => {
    setForm({
      name: "",
      amount: "",
      billing: "monthly",
      type: "auto",
      startDate: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.startDate) return;

    const payload = {
      name: form.name.trim(),
      amount: Number(form.amount),
      billing: form.billing ?? "monthly", // ✅ safety fallback
      type: form.type,
      startDate: form.startDate,
    };

    try {
      if (editingId) {
        await updateSubscription(editingId, payload);
      } else {
        await createSubscription(payload);
      }

      await load();
      resetForm();
    } catch (err) {
      console.error("SAVE ERROR:", err);
    }
  };

  const handleEdit = (item: Subscription) => {
    setEditingId(item._id);

    setForm({
      name: item.name ?? "",
      amount: item.amount?.toString() ?? "",
      billing: normalizeBilling(item.billing),
      type: normalizeType(item.type),
      startDate: formatDate(item.startDate),
    });

    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    await deleteSubscription(id);
    await load();
  };

  // =========================
  // 📊 YEARLY CALCULATIONS
  // =========================

  const totalPaidThisYear = subscriptions.reduce((sum, item) => {
    const paid = (item.payments ?? []).reduce((s, p) => {
      if (p.status === "paid" && isThisYear(p.date)) {
        return s + Number(p.amount);
      }
      return s;
    }, 0);

    return sum + paid;
  }, 0);

  const totalToPayThisYear = subscriptions.reduce((sum, item) => {
    const total = (item.payments ?? []).reduce((s, p) => {
      if (isThisYear(p.date)) {
        return s + Number(p.amount);
      }
      return s;
    }, 0);

    return sum + total;
  }, 0);

  const pendingThisYear = subscriptions.reduce((sum, item) => {
    const pending = (item.payments ?? []).reduce((s, p) => {
      if (p.status !== "paid" && isThisYear(p.date)) {
        return s + Number(p.amount);
      }
      return s;
    }, 0);

    return sum + pending;
  }, 0);

  if (loading) {
    return <div className="p-4 text-center text-white">Loading...</div>;
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md mx-auto font-sans bg-[#000000]">

      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => setShowAmounts((p) => !p)}
          className="text-gray-400"
        >
          {showAmounts ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>

        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-[0.7rem] py-[0.3rem] bg-[#DFF966] text-black font-bold rounded-4xl text-sm"
        >
          +
        </button>
      </div>

      {/* 📊 YEARLY DASHBOARD */}
      <div className="mb-6 grid grid-cols-3 gap-3">

        <div className="p-4 bg-[#1f1b1c] rounded-xl text-center">
          <p className="text-gray-400 text-xs">Paid</p>
          <p className="text-lg font-bold text-[#85D989] mt-2">
            {showAmounts ? totalPaidThisYear.toLocaleString() : mask(totalPaidThisYear)}
          </p>
        </div>

        <div className="p-4 bg-[#1f1b1c] rounded-xl text-center">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-lg font-bold text-white mt-2">
            {showAmounts ? totalToPayThisYear.toLocaleString() : mask(totalToPayThisYear)}
          </p>
        </div>

        <div className="p-4 bg-[#1f1b1c] rounded-xl text-center">
          <p className="text-gray-400 text-xs">Pending</p>
          <p className="text-lg font-bold text-[#EF6C54] mt-2">
            {showAmounts ? pendingThisYear.toLocaleString() : mask(pendingThisYear)}
          </p>
        </div>

      </div>

      {/* LIST */}
      <div className="space-y-3">
        {subscriptions.map((item, index) => {
          // const amount = Number(item.amount ?? 0);

          const totalPerItem = (item.payments ?? []).reduce((sum, p) => {
          if (isThisYear(p.date)) {
            return sum + Number(p.amount);
          }
          return sum;
        }, 0);

        const paidPerItem = (item.payments ?? []).reduce((sum, p) => {
          if (p.status === "paid" && isThisYear(p.date)) {
            return sum + Number(p.amount);
          }
          return sum;
        }, 0);

          return (
            <div key={item._id} className="bg-[#1f1b1c] rounded-xl overflow-hidden">

              <button
                className="w-full flex justify-between items-center px-4 py-3"
                onClick={() => toggleExpand(index)}
              >
                <div className="text-left">
                  <p className="font-medium text-[0.8rem] text-white">
                    {item.name}
                  </p>

                  {/* ✅ FIXED BILLING DISPLAY */}
                  <p className="text-xs text-[#9C9BA1]">
                    {normalizeBilling(item.billing)} | {normalizeType(item.type)}
                  </p>
                </div>

               <p className="font-bold text-[#85D989] text-[0.8rem]  ">
                {showAmounts
                  ? `${paidPerItem.toLocaleString()} `
                  : `${mask(paidPerItem)} / ${mask(totalPerItem)}`}
              </p>
              </button>

              {expanded === index && (
                <div className="border-t border-[#2c2c2e] px-4 py-3">

                  <div className="space-y-2">
                    {item.payments?.map((p: Payment) => (
                      <div
                        key={p._id}
                        className="flex justify-between items-center gap-2"
                      >
                        <input
                          type="date"
                          value={formatDate(p.date)}
                          onChange={async (e) => {
                            await updatePayment({
                              subId: item._id,
                              paymentId: p._id,
                              date: e.target.value,
                              status: p.status,
                            });
                            load();
                          }}
                          className="bg-transparent text-white text-sm"
                        />

                        <span className="text-white text-sm">
                          {p.amount}
                        </span>

                        <button
                          onClick={async () => {
                            await updatePayment({
                              subId: item._id,
                              paymentId: p._id,
                              status: p.status === "paid" ? "pending" : "paid",
                            });
                            load();
                          }}
                          className={`text-sm ${
                            p.status === "paid"
                              ? "text-[#85D989]"
                              : "text-[#EF6C54]"
                          }`}
                        >
                          {p.status}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 py-2 rounded-lg bg-[#2C2C2E] text-white text-sm flex items-center justify-center gap-2"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm"
                    >
                      Delete
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL (unchanged) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xl/70">
          <div className="w-full max-w-sm p-5 bg-[#1f1b1c] rounded-xl space-y-3">

            <h2 className="text-white text-lg font-semibold">
              {editingId ? "Edit Subscription" : "Add Subscription"}
            </h2>

            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm((p) => ({ ...p, name: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white border border-gray-600"
            />

            <input
              type="number"
              placeholder="Amount"
              value={form.amount}
              onChange={(e) =>
                setForm((p) => ({ ...p, amount: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white border border-gray-600"
            />
            {/* BILLING */}
            <select
              value={form.billing}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  billing: e.target.value as "monthly" | "yearly",
                }))
              }
              className="w-full px-3 py-2 rounded-lg text-white bg-[#1f1b1c] border border-gray-600"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            <select
              value={form.type}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  type: e.target.value as SubType,
                }))
              }
              className="w-full px-3 py-2 rounded-lg text-white bg-[#1f1b1c] border border-gray-600"
            >
              <option value="auto">Auto Deduct</option>
              <option value="manual">Manual</option>
            </select>

            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((p) => ({ ...p, startDate: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white border border-gray-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={resetForm} className="text-gray-400">
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-3 py-1 bg-[#EB5647] text-white rounded-lg"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}