import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection, addDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp
} from "firebase/firestore";
import { FiPlus, FiTrash2, FiFilter } from "react-icons/fi";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment", "Health",
  "Education", "Utilities", "Rent", "Salary", "Freelance",
  "Investment", "Gift", "Other"
];

export default function TransactionsPage() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ type: "expense", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
  const [filterType, setFilterType] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users", currentUser.uid, "transactions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser.uid]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) return;
    setLoading(true);
    await addDoc(collection(db, "users", currentUser.uid, "transactions"), {
      ...form,
      amount: parseFloat(form.amount),
      createdAt: serverTimestamp(),
    });
    setForm({ type: "expense", amount: "", category: "Food", date: new Date().toISOString().split("T")[0], note: "" });
    setShowForm(false);
    setLoading(false);
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "users", currentUser.uid, "transactions", id));
  }

  const filtered = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false;
    if (filterCat !== "all" && t.category !== filterCat) return false;
    return true;
  });

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="section-title">Transactions</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)} id="add-tx-btn">
          <FiPlus /> Add Transaction
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="form-card">
          <h3>New Transaction</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} id="tx-type">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min="0.01"
                step="0.01"
                id="tx-amount"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} id="tx-category">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                id="tx-date"
              />
            </div>
            <div className="form-group form-wide">
              <label>Note (optional)</label>
              <input
                type="text"
                placeholder="Add a note..."
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                id="tx-note"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save Transaction"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <FiFilter />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} id="filter-type">
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} id="filter-cat">
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Transaction list */}
      <div className="tx-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found. Add one to get started!</p>
          </div>
        ) : (
          filtered.map((t) => (
            <div key={t.id} className={`tx-item ${t.type}`}>
              <div className="tx-info">
                <span className="badge">{t.category}</span>
                <p className="tx-note">{t.note || t.category}</p>
                <p className="tx-date">{t.date}</p>
              </div>
              <div className="tx-right">
                <p className="tx-amount" style={{ color: t.type === "income" ? "var(--green)" : "var(--red)" }}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </p>
                <button className="icon-btn delete" onClick={() => handleDelete(t.id)} title="Delete">
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
