import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection, doc, setDoc, onSnapshot, query
} from "firebase/firestore";
import { FiSave } from "react-icons/fi";

const CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment", "Health",
  "Education", "Utilities", "Rent", "Other"
];

export default function BudgetPage() {
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [editBudget, setEditBudget] = useState({});
  const [saving, setSaving] = useState(false);
  const [month] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    const budgetUnsub = onSnapshot(
      query(collection(db, "users", currentUser.uid, "budgets")),
      (snap) => {
        const data = {};
        snap.docs.forEach((d) => { data[d.id] = d.data(); });
        setBudgets(data);
        const defaults = {};
        CATEGORIES.forEach((c) => { defaults[c] = data[c]?.amount || ""; });
        setEditBudget(defaults);
      }
    );

    const txUnsub = onSnapshot(
      collection(db, "users", currentUser.uid, "transactions"),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }
    );

    return () => { budgetUnsub(); txUnsub(); };
  }, [currentUser.uid]);

  const monthlyExpenses = {};
  transactions.forEach((t) => {
    if (t.type === "expense" && t.date && t.date.startsWith(month)) {
      monthlyExpenses[t.category] = (monthlyExpenses[t.category] || 0) + t.amount;
    }
  });

  async function handleSave() {
    setSaving(true);
    for (const cat of CATEGORIES) {
      const val = parseFloat(editBudget[cat] || 0);
      await setDoc(doc(db, "users", currentUser.uid, "budgets", cat), { amount: val });
    }
    setSaving(false);
  }

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="section-title">Budget — {month}</h2>
        <button className="btn-primary" onClick={handleSave} disabled={saving} id="save-budget-btn">
          <FiSave /> {saving ? "Saving..." : "Save Budgets"}
        </button>
      </div>

      <p className="page-desc">Set monthly budgets per category and track your spending progress.</p>

      <div className="budget-grid">
        {CATEGORIES.map((cat) => {
          const budget = parseFloat(editBudget[cat] || 0);
          const spent = monthlyExpenses[cat] || 0;
          const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
          const over = spent > budget && budget > 0;

          return (
            <div key={cat} className="budget-card">
              <div className="budget-header">
                <span className="badge">{cat}</span>
                <span className={`budget-status ${over ? "over" : ""}`}>
                  {over ? "Over Budget!" : `${fmt(spent)} / ${fmt(budget)}`}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className={`progress-fill ${over ? "over" : pct > 75 ? "warn" : "ok"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="budget-input-row">
                <label>Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editBudget[cat] || ""}
                  onChange={(e) => setEditBudget({ ...editBudget, [cat]: e.target.value })}
                  placeholder="Set budget..."
                  id={`budget-${cat}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
