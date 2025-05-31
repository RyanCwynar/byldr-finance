"use client";
import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { monthlyAmount } from "@/lib/recurring";
import { monthlyOneTimeAmount } from "@/lib/oneTime";
import { formatCurrency } from "@/lib/formatters";
import { Modal } from "@/components/modal";
import { TransactionForm as RecurringForm } from "@/components/recurring/transaction-form";
import { TransactionForm as OneTimeForm } from "@/components/oneTime/transaction-form";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ChartPieIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import CashflowPieChart from "./CashflowPieChart";

interface Props {
  initialRecurring: Doc<"recurringTransactions">[];
  initialRecurringTags: string[];
  initialOneTime: Doc<"oneTimeTransactions">[];
  initialOneTimeTags: string[];
}

type Recurring = Doc<"recurringTransactions"> & { kind: "recurring" };
type OneTime = Doc<"oneTimeTransactions"> & { kind: "one-time" };
type Item = Recurring | OneTime;

export default function CashflowPageClient({
  initialRecurring,
  initialRecurringTags,
  initialOneTime,
  initialOneTimeTags,
}: Props) {
  const recurring =
    useQuery(api.recurring.listRecurringTransactions) ?? initialRecurring;
  const recurringTags =
    useQuery(api.recurring.listRecurringTags) ?? initialRecurringTags;
  const oneTime =
    useQuery(api.oneTime.listOneTimeTransactions) ?? initialOneTime;
  const oneTimeTags =
    useQuery(api.oneTime.listOneTimeTags) ?? initialOneTimeTags;

  const removeRecurring = useMutation(api.recurring.deleteRecurringTransaction);
  const removeOneTime = useMutation(api.oneTime.deleteOneTimeTransaction);
  const updateOneTime = useMutation(api.oneTime.updateOneTimeTransaction);

  const [views, setViews] = useState<Set<"recurring" | "one-time" | "future">>(
    new Set(["recurring", "one-time"]),
  );
  const toggleView = (v: "recurring" | "one-time" | "future") => {
    setViews((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };
  const [sortField, setSortField] = useState<"amount" | "date">("amount");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [tagFilter, setTagFilter] = useState("");
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [showOneTimeForm, setShowOneTimeForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<Recurring | null>(
    null,
  );
  const [editingOneTime, setEditingOneTime] = useState<OneTime | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [showChart, setShowChart] = useState(false);

  const allTags = useMemo(
    () => Array.from(new Set([...recurringTags, ...oneTimeTags])),
    [recurringTags, oneTimeTags],
  );

  const tagList = useMemo(
    () =>
      tagFilter
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    [tagFilter],
  );

  const filteredRecurring = useMemo(() => {
    if (tagList.length === 0) return recurring;
    return recurring.filter((t) =>
      tagList.every((tag) => t.tags?.includes(tag)),
    );
  }, [recurring, tagList]);

  const filteredOneTime = useMemo(() => {
    if (tagList.length === 0) return oneTime;
    return oneTime.filter((t) => tagList.every((tag) => t.tags?.includes(tag)));
  }, [oneTime, tagList]);

  const combined = useMemo<Item[]>(() => {
    const recItems: Recurring[] = filteredRecurring.map((r) => ({
      ...r,
      kind: "recurring",
    }));
    const oneItems: OneTime[] = filteredOneTime.map((o) => ({
      ...o,
      kind: "one-time",
    }));
    let arr: Item[] = [...recItems, ...oneItems];
    arr = arr.filter((i) => {
      const cats =
        i.kind === "recurring"
          ? ["recurring"]
          : i.date > Date.now()
          ? ["one-time", "future"]
          : ["one-time"];
      return cats.some((c) => views.has(c as typeof c & ("recurring" | "one-time" | "future")));
    });

    if (sortField === "date") {
      arr.sort((a, b) => {
        const da = a.kind === "one-time" ? a.date : 0;
        const db = b.kind === "one-time" ? b.date : 0;
        return sortDir === "asc" ? da - db : db - da;
      });
    } else {
      arr.sort((a, b) => {
        if (a.type !== b.type) return a.type === "income" ? -1 : 1;
        const amta =
          a.kind === "recurring"
            ? monthlyAmount(a)
            : monthlyOneTimeAmount(a.amount);
        const amtb =
          b.kind === "recurring"
            ? monthlyAmount(b)
            : monthlyOneTimeAmount(b.amount);
        const diff = amtb - amta;
        return sortDir === "asc" ? -diff : diff;
      });
    }
    return arr;
  }, [filteredRecurring, filteredOneTime, views, sortField, sortDir]);

  const visibleItems = useMemo(
    () =>
      combined.filter(
        (t) => !hiddenIds.has(t._id) && !(t.kind === 'one-time' && t.hidden)
      ),
    [combined, hiddenIds],
  );

  const pieData = useMemo(
    () =>
      visibleItems.map((t) => ({
        label: t.name,
        amount:
          t.kind === 'recurring'
            ? monthlyAmount(t)
            : monthlyOneTimeAmount(t.amount),
      })),
    [visibleItems],
  );

  const monthlyTotals = useMemo(() => {
    return visibleItems.reduce(
      (acc, t) => {
        const amt =
          t.kind === "recurring"
            ? monthlyAmount(t)
            : monthlyOneTimeAmount(t.amount);
        if (t.type === "income") acc.income += amt;
        else acc.expense += amt;
        return acc;
      },
      { income: 0, expense: 0 },
    );
  }, [visibleItems]);

  const dailyTotals = useMemo(
    () => ({
      income: monthlyTotals.income / 30,
      expense: monthlyTotals.expense / 30,
    }),
    [monthlyTotals],
  );

  const annualTotals = useMemo(
    () => ({
      income: monthlyTotals.income * 12,
      expense: monthlyTotals.expense * 12,
    }),
    [monthlyTotals],
  );

  const weeklyTotals = useMemo(
    () => ({
      income: annualTotals.income / 52,
      expense: annualTotals.expense / 52,
    }),
    [annualTotals],
  );

  const handleDelete = async (item: Item) => {
    if (item.kind === "recurring")
      await removeRecurring({ id: item._id as Id<"recurringTransactions"> });
    else await removeOneTime({ id: item._id as Id<"oneTimeTransactions"> });
  };

  const handleEdit = (item: Item) => {
    if (item.kind === "recurring") {
      setEditingRecurring(item);
      setShowRecurringForm(true);
    } else {
      setEditingOneTime(item);
      setShowOneTimeForm(true);
    }
  };

  const toggleHidden = async (item: Item) => {
    if (item.kind === 'one-time') {
      await updateOneTime({
        id: item._id as Id<'oneTimeTransactions'>,
        hidden: !item.hidden,
      });
    } else {
      setHiddenIds((prev) => {
        const next = new Set(prev);
        if (next.has(item._id)) next.delete(item._id);
        else next.add(item._id);
        return next;
      });
    }
  };

  const pillClass = (active: boolean) =>
    `px-3 py-1 rounded-full text-sm cursor-pointer ${active ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"}`;

  return (
    <div className="flex flex-col gap-4 max-w-6xl mx-auto relative">
      <div className="overflow-x-auto w-full">
        <div className="text-sm mt-2 w-full border border-gray-700 rounded-md overflow-hidden">
          <div className="grid grid-cols-4 text-center">
            <div className="p-2 font-semibold">Daily</div>
            <div className="p-2 font-semibold">Weekly</div>
            <div className="p-2 font-semibold">Monthly</div>
            <div className="p-2 font-semibold">Annual</div>
          </div>
          <div className="relative grid grid-cols-4 text-center border-t border-gray-700 group">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 pointer-events-none">Income</div>
            <div className="p-2 text-green-500">{formatCurrency(dailyTotals.income)}</div>
            <div className="p-2 text-green-500">{formatCurrency(weeklyTotals.income)}</div>
            <div className="p-2 text-green-500">{formatCurrency(monthlyTotals.income)}</div>
            <div className="p-2 text-green-500">{formatCurrency(annualTotals.income)}</div>
          </div>
          <div className="relative grid grid-cols-4 text-center border-t border-gray-700 group">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:block text-gray-400 pointer-events-none">Cost</div>
            <div className="p-2 text-red-500">{formatCurrency(dailyTotals.expense)}</div>
            <div className="p-2 text-red-500">{formatCurrency(weeklyTotals.expense)}</div>
            <div className="p-2 text-red-500">{formatCurrency(monthlyTotals.expense)}</div>
            <div className="p-2 text-red-500">{formatCurrency(annualTotals.expense)}</div>
          </div>
          <div className="relative grid grid-cols-4 text-center border-t border-gray-700 group">
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden group-hover:block font-semibold text-gray-400 pointer-events-none">Net</div>
            <div
              className={`p-2 ${dailyTotals.income - dailyTotals.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {formatCurrency(dailyTotals.income - dailyTotals.expense)}
            </div>
            <div
              className={`p-2 ${weeklyTotals.income - weeklyTotals.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {formatCurrency(weeklyTotals.income - weeklyTotals.expense)}
            </div>
            <div
              className={`p-2 ${monthlyTotals.income - monthlyTotals.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {formatCurrency(monthlyTotals.income - monthlyTotals.expense)}
            </div>
            <div
              className={`p-2 ${annualTotals.income - annualTotals.expense >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {formatCurrency(annualTotals.income - annualTotals.expense)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <h1 className="text-2xl font-bold">Incomes and Expenses</h1>
        <div className="flex items-center gap-2">
          <input
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            list="transaction-tag-filter"
            placeholder="Filter tags"
            className="px-2 py-1 rounded-md border border-gray-600 bg-gray-800"
          />
          <datalist id="transaction-tag-filter">
            {allTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button
            onClick={() => {
              setEditingRecurring(null);
              setShowRecurringForm(true);
            }}
            className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Recurring</span>
          </button>
          <button
            onClick={() => {
              setEditingOneTime(null);
              setShowOneTimeForm(true);
            }}
            className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-md bg-blue-600 text-white"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add One Time</span>
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => toggleView("recurring")}
          className={pillClass(views.has("recurring"))}
        >
          Recurring
        </button>
        <button
          onClick={() => toggleView("one-time")}
          className={pillClass(views.has("one-time"))}
        >
          One Time
        </button>
        <button
          onClick={() => toggleView("future")}
          className={pillClass(views.has("future"))}
        >
          Future
        </button>
      </div>
      {/* Mobile card list */}
      <div className="md:hidden space-y-3">
        {combined.map((t) => (
          <div
            key={t._id}
            className={`bg-white/5 rounded-lg p-4 space-y-2 ${
              t.kind === "one-time" && t.date > Date.now()
                ? "ring-2 ring-yellow-500"
                : ""
            } ${t.kind === 'one-time' ? (t.hidden ? 'opacity-50' : '') : hiddenIds.has(t._id) ? 'opacity-50' : ''}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{t.name}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => toggleHidden(t)}
                  className="p-1 rounded hover:bg-gray-700"
                  title={t.kind === 'one-time' ? (t.hidden ? 'Show' : 'Hide') : hiddenIds.has(t._id) ? 'Show' : 'Hide'}
                >
                  {t.kind === 'one-time'
                    ? t.hidden
                      ? <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                      : <EyeIcon className="w-5 h-5 text-gray-400" />
                    : hiddenIds.has(t._id)
                    ? <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                    : <EyeIcon className="w-5 h-5 text-gray-400" />}
                </button>
                <button
                  onClick={() => handleEdit(t)}
                  className="p-1 rounded hover:bg-gray-700"
                >
                  <PencilIcon className="w-5 h-5 text-blue-400" />
                </button>
                <button
                  onClick={() => handleDelete(t)}
                  className="p-1 rounded hover:bg-gray-700"
                >
                  <TrashIcon className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Amount</span>
                <span className="font-mono">{formatCurrency(t.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Monthly</span>
                <span className="font-mono">
                  {t.kind === "recurring"
                    ? formatCurrency(monthlyAmount(t))
                    : formatCurrency(monthlyOneTimeAmount(t.amount))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Type</span>
                <span>{t.type === "income" ? "Income" : "Expense"}</span>
              </div>
              <div className="flex justify-between">
                <span>Frequency</span>
                <span>
                  {t.kind === "recurring"
                    ? t.frequency === "monthly"
                      ? `Monthly on ${t.daysOfMonth?.join(", ")}`
                      : t.frequency === "weekly"
                        ? `Weekly on ${t.daysOfWeek?.join(", ")}`
                        : t.frequency === "quarterly"
                          ? `Quarterly starting ${t.month}/${t.day}`
                          : `Yearly on ${t.month}/${t.day}`
                    : "-"}
                </span>
              </div>
              {t.kind === "one-time" && (
                <div className="flex justify-between">
                  <span>Date</span>
                  <span>{new Date(t.date).toLocaleDateString()}</span>
                </div>
              )}
              {t.tags && t.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Name</th>
              <th
                className="px-2 py-1 text-left cursor-pointer"
                onClick={() => {
                  if (sortField === "amount") {
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("amount");
                    setSortDir("desc");
                  }
                }}
              >
                Amount
              </th>
              <th className="px-2 py-1 text-left">Monthly Total</th>
              <th className="px-2 py-1 text-left">Type</th>
              <th className="px-2 py-1 text-left">Frequency</th>
              <th
                className="px-2 py-1 text-left cursor-pointer"
                onClick={() => {
                  if (sortField === "date") {
                    setSortDir(sortDir === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("date");
                    setSortDir("asc");
                  }
                }}
              >
                Date
              </th>
              <th className="px-2 py-1 text-left">Tags</th>
              <th className="px-2 py-1 text-right w-20 whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {combined.map((t) => (
              <tr
                key={t._id}
                className={`border-t border-gray-700 ${
                  t.kind === "one-time" && t.date > Date.now()
                    ? "bg-yellow-900/40"
                    : ""
                } ${t.kind === 'one-time' ? (t.hidden ? 'opacity-50' : '') : hiddenIds.has(t._id) ? 'opacity-50' : ''}`}
              >
                <td className="px-2 py-1">{t.name}</td>
                <td className="px-2 py-1">{formatCurrency(t.amount)}</td>
                <td className="px-2 py-1">
                  {t.kind === "recurring"
                    ? formatCurrency(monthlyAmount(t))
                    : formatCurrency(monthlyOneTimeAmount(t.amount))}
                </td>
                <td className="px-2 py-1">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      t.type === "income"
                        ? "bg-green-700 text-green-200"
                        : "bg-red-700 text-red-200"
                    }`}
                  >
                    {t.type === "income" ? "Income" : "Expense"}
                  </span>
                </td>
                <td className="px-2 py-1">
                  {t.kind === "recurring"
                    ? t.frequency === "monthly"
                      ? `Monthly on ${t.daysOfMonth?.join(", ")}`
                      : t.frequency === "weekly"
                        ? `Weekly on ${t.daysOfWeek?.join(", ")}`
                        : t.frequency === "quarterly"
                          ? `Quarterly starting ${t.month}/${t.day}`
                          : `Yearly on ${t.month}/${t.day}`
                    : "-"}
                </td>
                <td className="px-2 py-1">
                  {t.kind === "one-time"
                    ? new Date(t.date).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-2 py-1">
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {t.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-2 py-1 text-right space-x-2 w-20 whitespace-nowrap">
                  <button
                    onClick={() => toggleHidden(t)}
                    className="p-1 rounded hover:bg-gray-700"
                    title={t.kind === 'one-time' ? (t.hidden ? 'Show' : 'Hide') : hiddenIds.has(t._id) ? 'Show' : 'Hide'}
                  >
                    {t.kind === 'one-time'
                      ? t.hidden
                        ? <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                        : <EyeIcon className="w-5 h-5 text-gray-400" />
                      : hiddenIds.has(t._id)
                        ? <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                        : <EyeIcon className="w-5 h-5 text-gray-400" />}
                  </button>
                  <button
                    onClick={() => handleEdit(t)}
                    className="p-1 rounded hover:bg-gray-700"
                    title="Edit"
                  >
                    <PencilIcon className="w-5 h-5 text-blue-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-1 rounded hover:bg-gray-700"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5 text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={() => {
          setEditingRecurring(null);
          setShowRecurringForm(true);
        }}
        className="sm:hidden fixed bottom-20 right-4 p-4 rounded-full bg-blue-600 text-white shadow-lg"
        aria-label="Add recurring transaction"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
      <button
        onClick={() => {
          setEditingOneTime(null);
          setShowOneTimeForm(true);
        }}
        className="sm:hidden fixed bottom-4 right-4 p-4 rounded-full bg-blue-600 text-white shadow-lg"
        aria-label="Add one time transaction"
      >
        <PlusIcon className="w-6 h-6" />
      </button>
      {showRecurringForm && (
        <Modal
          onClose={() => {
            setShowRecurringForm(false);
            setEditingRecurring(null);
          }}
        >
          <RecurringForm
            onClose={() => {
              setShowRecurringForm(false);
              setEditingRecurring(null);
            }}
            transaction={editingRecurring || undefined}
          />
        </Modal>
      )}
      {showOneTimeForm && (
        <Modal
          onClose={() => {
            setShowOneTimeForm(false);
            setEditingOneTime(null);
          }}
        >
          <OneTimeForm
            onClose={() => {
              setShowOneTimeForm(false);
              setEditingOneTime(null);
            }}
            transaction={editingOneTime || undefined}
          />
        </Modal>
      )}
      {/* Pie chart drawer */}
      <button
        onClick={() => setShowChart((prev) => !prev)}
        className="fixed top-1/4 right-0 z-30 p-2 rounded-l-md bg-blue-600 text-white"
        aria-label="Toggle chart"
      >
        <ChartPieIcon className="w-5 h-5" />
      </button>
      <div
        className={`fixed top-0 right-0 h-full w-96 bg-gray-900 text-gray-100 p-6 transform transition-transform z-20 ${showChart ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <button
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white"
          onClick={() => setShowChart(false)}
          aria-label="Close chart"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
        <CashflowPieChart data={pieData} />
      </div>
    </div>
  );
}
