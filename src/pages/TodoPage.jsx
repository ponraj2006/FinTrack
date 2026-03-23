import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection, addDoc, deleteDoc, updateDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";
import { FiPlus, FiTrash2, FiCheck } from "react-icons/fi";
import { format } from "date-fns";

export default function TodoPage() {
  const { currentUser } = useAuth();
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "users", currentUser.uid, "todos"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTodos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser.uid]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "users", currentUser.uid, "todos"), {
      text: text.trim(),
      priority,
      completed: false,
      date: format(new Date(), "yyyy-MM-dd"),
      createdAt: serverTimestamp(),
    });
    setText("");
    setLoading(false);
  }

  async function toggleComplete(todo) {
    await updateDoc(doc(db, "users", currentUser.uid, "todos", todo.id), {
      completed: !todo.completed,
    });
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "users", currentUser.uid, "todos", id));
  }

  // Group by date
  const grouped = todos.reduce((acc, todo) => {
    const date = todo.date || "Unknown date";
    if (!acc[date]) acc[date] = [];
    acc[date].push(todo);
    return acc;
  }, {});

  const pending = todos.filter((t) => !t.completed).length;
  const done = todos.filter((t) => t.completed).length;

  return (
    <div className="page">
      <h2 className="section-title">Todo List</h2>

      {/* Stats */}
      <div className="todo-stats">
        <span className="todo-stat pending">{pending} Pending</span>
        <span className="todo-stat done">{done} Completed</span>
        <span className="todo-stat total">{todos.length} Total</span>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="todo-form">
        <input
          type="text"
          placeholder="Add a new task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          id="todo-input"
          className="todo-input"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="priority-select"
          id="todo-priority"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="btn-primary" disabled={loading} id="add-todo-btn">
          <FiPlus /> Add
        </button>
      </form>

      {/* Grouped list */}
      {Object.keys(grouped).length === 0 ? (
        <div className="empty-state">
          <p>No todos yet. Add your first task above!</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, items]) => (
          <div key={date} className="todo-group">
            <p className="todo-date-label">{date}</p>
            {items.map((todo) => (
              <div
                key={todo.id}
                className={`todo-item priority-${todo.priority} ${todo.completed ? "completed" : ""}`}
              >
                <button
                  className={`check-btn ${todo.completed ? "checked" : ""}`}
                  onClick={() => toggleComplete(todo)}
                  title="Toggle complete"
                >
                  {todo.completed && <FiCheck />}
                </button>
                <span className="todo-text">{todo.text}</span>
                <span className={`priority-badge ${todo.priority}`}>{todo.priority}</span>
                <button className="icon-btn delete" onClick={() => handleDelete(todo.id)} title="Delete">
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
