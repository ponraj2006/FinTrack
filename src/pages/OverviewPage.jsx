import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiActivity } from "react-icons/fi";
import { format, parseISO, startOfMonth, isWithinInterval, endOfMonth } from "date-fns";

const COLORS = ["#6c63ff", "#ff6584", "#43e97b", "#f093fb", "#fda085", "#4facfe"];

export default function OverviewPage() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "users", currentUser.uid, "transactions"),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser.uid]);

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  // Monthly line chart data
  const monthlyMap = {};
  transactions.forEach((t) => {
    const month = t.date ? format(parseISO(t.date), "MMM yy") : "—";
    if (!monthlyMap[month]) monthlyMap[month] = { month, income: 0, expense: 0 };
    if (t.type === "income") monthlyMap[month].income += t.amount;
    else monthlyMap[month].expense += t.amount;
  });
  const lineData = Object.values(monthlyMap).reverse().slice(-6);

  // Category pie chart
  const catMap = {};
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const pieData = Object.entries(catMap).map(([name, value]) => ({ name, value }));

  // Recent transactions
  const recent = transactions.slice(0, 5);

  const fmt = (n) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="page">
      <h2 className="section-title">Overview</h2>

      {/* Summary cards */}
      <div className="cards-grid">
        <div className="stat-card balance">
          <div className="stat-icon"><FiDollarSign /></div>
          <div>
            <p className="stat-label">Total Balance</p>
            <p className="stat-value" style={{ color: balance >= 0 ? "var(--green)" : "var(--red)" }}>
              {fmt(balance)}
            </p>
          </div>
        </div>
        <div className="stat-card income">
          <div className="stat-icon"><FiTrendingUp /></div>
          <div>
            <p className="stat-label">Total Income</p>
            <p className="stat-value" style={{ color: "var(--green)" }}>{fmt(totalIncome)}</p>
          </div>
        </div>
        <div className="stat-card expense">
          <div className="stat-icon"><FiTrendingDown /></div>
          <div>
            <p className="stat-label">Total Expenses</p>
            <p className="stat-value" style={{ color: "var(--red)" }}>{fmt(totalExpense)}</p>
          </div>
        </div>
        <div className="stat-card tx-count">
          <div className="stat-icon"><FiActivity /></div>
          <div>
            <p className="stat-label">Transactions</p>
            <p className="stat-value">{transactions.length}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Trend</h3>
          {lineData.length === 0 ? (
            <p className="empty-msg">No data yet. Add transactions to see trends.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 8 }}
                  labelStyle={{ color: "var(--text)" }}
                />
                <Line type="monotone" dataKey="income" stroke="#43e97b" strokeWidth={2} dot={false} name="Income" />
                <Line type="monotone" dataKey="expense" stroke="#ff6584" strokeWidth={2} dot={false} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="chart-card">
          <h3>Expense by Category</h3>
          {pieData.length === 0 ? (
            <p className="empty-msg">No expense data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="chart-card">
        <h3>Recent Transactions</h3>
        {recent.length === 0 ? (
          <p className="empty-msg">No transactions yet.</p>
        ) : (
          <table className="tx-table">
            <thead>
              <tr><th>Date</th><th>Category</th><th>Note</th><th>Amount</th></tr>
            </thead>
            <tbody>
              {recent.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td><span className="badge">{t.category}</span></td>
                  <td>{t.note || "—"}</td>
                  <td style={{ color: t.type === "income" ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
