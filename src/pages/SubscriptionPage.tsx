import { useEffect, useState } from "react";
import type { Subscription, Payment } from "../types/subscription.type";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  updatePayment,
  createPayment,
} from "../api/subscription";

import {
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

type PaymentStatus = "pending" | "prepared" | "paid";

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

  // subscription form (NO amount/date inside subscription anymore)
  const [form, setForm] = useState({
    name: "",
  });

  // new payment input
  const [newPayment, setNewPayment] = useState({
    date: "",
    amount: "",
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
    setForm({ name: "" });
    setEditingId(null);
    setShowForm(false);
  };

  // =========================
  // SUBSCRIPTION SAVE
  // =========================
  const handleSave = async () => {
    if (!form.name.trim()) return;

    try {
      if (editingId) {
        await updateSubscription(editingId, { name: form.name.trim() });
      } else {
        await createSubscription({ name: form.name.trim() });
      }

      await load();
      resetForm();
    } catch (err) {
      console.error("SAVE ERROR:", err);
    }
  };

  const handleEdit = (item: Subscription) => {
    setEditingId(item._id);
    setForm({ name: item.name ?? "" });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;

    await deleteSubscription(id);
    await load();
  };

  // =========================
  // PAYMENT HELPERS
  // =========================
  const nextStatus = (status: PaymentStatus): PaymentStatus =>
    status === "pending"
      ? "prepared"
      : status === "prepared"
      ? "paid"
      : "pending";

  const handleCreatePayment = async (item: Subscription) => {
    if (!item?._id || !newPayment.date || !newPayment.amount) return;

    try {
      await createPayment(item._id, {
        date: newPayment.date,
        amount: Number(newPayment.amount),
        status: "pending",
      });

      setNewPayment({ date: "", amount: "" });
      load();
    } catch (err) {
      console.error("createPayment error:", err);
    }
  };

  const handleUpdatePayment = async (
    item: Subscription,
    p: Payment
  ) => {
    if (!item?._id || !p || !p._id) {
  console.warn("Missing payment ID:", p);
  return;
}

    await updatePayment({
      subId: item._id,
      paymentId: p._id,
      status: nextStatus(p.status as PaymentStatus),
    });

    load();
  };

  const handleUpdateDate = async (
    item: Subscription,
    p: Payment,
    date: string
  ) => {
    if (!item?._id || !p?._id) return;

    await updatePayment({
      subId: item._id,
      paymentId: p._id,
      date,
      status: p.status,
    });

    load();
  };

  // =========================
  // DASHBOARD TOTALS
  // =========================
  const totalPaidThisYear = subscriptions.reduce((sum, item) => {
    return (
      sum +
      (item.payments ?? []).reduce((s, p) => {
        if (p.status === "paid" && isThisYear(p.date)) {
          return s + Number(p.amount);
        }
        return s;
      }, 0)
    );
  }, 0);

  const totalPreparedThisYear = subscriptions.reduce((sum, item) => {
    return (
      sum +
      (item.payments ?? []).reduce((s, p) => {
        if (p.status === "prepared" && isThisYear(p.date)) {
          return s + Number(p.amount);
        }
        return s;
      }, 0)
    );
  }, 0);

  const pendingThisYear = subscriptions.reduce((sum, item) => {
    return (
      sum +
      (item.payments ?? []).reduce((s, p) => {
        if (p.status === "pending" && isThisYear(p.date)) {
          return s + Number(p.amount);
        }
        return s;
      }, 0)
    );
  }, 0);

  const totalToPayThisYear =
    totalPaidThisYear + totalPreparedThisYear + pendingThisYear;

  if (loading) {
    return <div className="p-4 text-center text-white">Loading...</div>;
  }

  return (
    <div className="px-6 pb-6 mt-8 max-w-md mx-auto font-sans bg-[#000000]">

      {/* HEADER */}
      <div className="mb-4 flex justify-between items-center">
        <button onClick={() => setShowAmounts(p => !p)} className="text-gray-400">
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

      {/* DASHBOARD */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <div className="p-4 bg-[#1C1C1E] rounded-xl text-center">
          <p className="text-gray-400 text-xs">Paid</p>
          <p className="text-lg font-bold text-[#85D989] mt-2">
            ₱{showAmounts ? totalPaidThisYear.toLocaleString() : mask(totalPaidThisYear)}
          </p>
        </div>

        <div className="p-4 bg-[#1C1C1E] rounded-xl text-center">
          <p className="text-gray-400 text-xs">Prepared</p>
          <p className="text-lg font-bold text-yellow-400 mt-2">
            ₱{showAmounts ? totalPreparedThisYear.toLocaleString() : mask(totalPreparedThisYear)}
          </p>
        </div>

        <div className="p-4 bg-[#1C1C1E] rounded-xl text-center">
          <p className="text-gray-400 text-xs">Pending</p>
          <p className="text-lg font-bold text-[#EF6C54] mt-2">
            ₱{showAmounts ? pendingThisYear.toLocaleString() : mask(pendingThisYear)}
          </p>
        </div>

        <div className="p-4 bg-[#1C1C1E] rounded-xl text-center">
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-lg font-bold text-white mt-2">
            ₱{showAmounts ? totalToPayThisYear.toLocaleString() : mask(totalToPayThisYear)}
          </p>
        </div>
      </div>

      {/* LIST */}
      <div className="space-y-3">

        {subscriptions.map((item, index) => {

          const totalPerItem = (item.payments ?? []).reduce((sum, p) => {
            if (isThisYear(p.date)) return sum + Number(p.amount);
            return sum;
          }, 0);

          const paidPerItem = (item.payments ?? []).reduce((sum, p) => {
            if (p.status === "paid" && isThisYear(p.date)) {
              return sum + Number(p.amount);
            }
            return sum;
          }, 0);

          return (
            <div key={item._id} className="bg-[#1C1C1E] rounded-xl overflow-hidden">

              <button
                className="w-full flex justify-between items-center px-4 py-3"
                onClick={() => toggleExpand(index)}
              >
                <div className="text-left">
                  <p className="font-medium text-[0.8rem] text-white">
                    {item.name}
                  </p>
                </div>

                <p className="font-bold text-[#85D989] text-[0.8rem]">
                  {showAmounts
                    ? `${paidPerItem.toLocaleString()} / ${totalPerItem.toLocaleString()}`
                    : `${mask(paidPerItem)} / ${mask(totalPerItem)}`}
                </p>
              </button>

              {expanded === index && (
                <div className="border-t border-[#2c2c2e] px-4 py-3">

                  {/* ADD PAYMENT */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="date"
                      value={newPayment.date}
                      onChange={(e) =>
                        setNewPayment(p => ({ ...p, date: e.target.value }))
                      }
                      className="bg-[#2C2C2E] text-white text-sm p-2 rounded w-full"
                    />

                    <input
                      type="number"
                      placeholder="Amount"
                      value={newPayment.amount}
                      onChange={(e) =>
                        setNewPayment(p => ({ ...p, amount: e.target.value }))
                      }
                      className="bg-[#2C2C2E] text-white text-sm p-2 rounded w-full"
                    />

                    <button
                      onClick={() => handleCreatePayment(item)}
                      className="px-3 bg-[#DFF966] text-black rounded"
                    >
                      +
                    </button>
                  </div>

                  {/* PAYMENTS */}
                  <div className="space-y-2">
                    {item.payments?.map((p: Payment) => (
                      <div key={p._id} className="flex justify-between items-center gap-2">

                        <input
                          type="date"
                          value={formatDate(p.date)}
                          onChange={(e) =>
                            handleUpdateDate(item, p, e.target.value)
                          }
                          className="bg-transparent text-white text-sm"
                        />

                        <span className="text-white text-sm">
                          ₱{p.amount}
                        </span>

                        <button
                          onClick={() => handleUpdatePayment(item, p)}
                          className={`text-sm font-medium ${
                            p.status === "paid"
                              ? "text-[#85D989]"
                              : p.status === "prepared"
                              ? "text-yellow-400"
                              : "text-[#EF6C54]"
                          }`}
                        >
                          {p.status}
                        </button>

                      </div>
                    ))}
                  </div>

                  {/* ACTIONS */}
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

      {/* MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xl">

          <div className="w-full max-w-sm p-5 bg-[#1C1C1E] rounded-xl space-y-3">

            <h2 className="text-white text-lg font-semibold">
              {editingId ? "Edit Subscription" : "Add Subscription"}
            </h2>

            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) =>
                setForm(p => ({ ...p, name: e.target.value }))
              }
              className="w-full px-3 py-2 rounded-lg text-white border border-gray-600"
            />

            <div className="flex justify-end gap-2 pt-2 flex-col w-full">

              <button onClick={resetForm} className="text-gray-400">
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-3 py-1 bg-[#DFF966] text-black rounded-lg"
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