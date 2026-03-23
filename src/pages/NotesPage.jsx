import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
  collection, doc, setDoc, deleteDoc,
  onSnapshot, query, orderBy
} from "firebase/firestore";
import { FiSave, FiTrash2, FiPlus, FiCalendar } from "react-icons/fi";
import { format } from "date-fns";

export default function NotesPage() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [noteText, setNoteText] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [editing, setEditing] = useState(null); // note id being edited
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users", currentUser.uid, "notes"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setNotes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [currentUser.uid]);

  const notesForDate = notes.filter((n) => n.date === selectedDate);

  async function handleSave() {
    if (!noteTitle.trim() && !noteText.trim()) return;
    setSaving(true);
    const id = editing || `${currentUser.uid}_${selectedDate}_${Date.now()}`;
    await setDoc(doc(db, "users", currentUser.uid, "notes", id), {
      title: noteTitle.trim() || "Untitled",
      text: noteText.trim(),
      date: selectedDate,
      updatedAt: new Date().toISOString(),
    });
    setNoteTitle("");
    setNoteText("");
    setEditing(null);
    setSaving(false);
  }

  function handleEdit(note) {
    setEditing(note.id);
    setNoteTitle(note.title);
    setNoteText(note.text);
    setSelectedDate(note.date);
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "users", currentUser.uid, "notes", id));
    if (editing === id) {
      setEditing(null);
      setNoteTitle("");
      setNoteText("");
    }
  }

  // Group all notes by date for the sidebar
  const dateGroups = notes.reduce((acc, n) => {
    if (!acc[n.date]) acc[n.date] = 0;
    acc[n.date]++;
    return acc;
  }, {});

  return (
    <div className="page">
      <h2 className="section-title">Personal Notes</h2>

      <div className="notes-layout">
        {/* Date sidebar */}
        <aside className="notes-sidebar">
          <h3><FiCalendar /> Dates</h3>
          <div className="date-picker-wrap">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setEditing(null); setNoteTitle(""); setNoteText(""); }}
              id="notes-date"
              className="date-picker"
            />
          </div>
          <div className="date-list">
            {Object.entries(dateGroups).sort((a, b) => b[0].localeCompare(a[0])).map(([date, count]) => (
              <button
                key={date}
                className={`date-btn ${selectedDate === date ? "active" : ""}`}
                onClick={() => { setSelectedDate(date); setEditing(null); setNoteTitle(""); setNoteText(""); }}
              >
                <span>{date}</span>
                <span className="note-count">{count}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Notes content */}
        <div className="notes-content">
          {/* Editor */}
          <div className="note-editor">
            <div className="editor-header">
              <span className="editor-date">{selectedDate}</span>
              <span>{editing ? "✏️ Editing note" : "📝 New note"}</span>
            </div>
            <input
              type="text"
              placeholder="Note title..."
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="note-title-input"
              id="note-title"
            />
            <textarea
              placeholder="Write your note here..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="note-textarea"
              id="note-body"
              rows={6}
            />
            <div className="editor-actions">
              <button className="btn-primary" onClick={handleSave} disabled={saving} id="save-note-btn">
                <FiSave /> {saving ? "Saving..." : editing ? "Update Note" : "Save Note"}
              </button>
              {editing && (
                <button className="btn-ghost" onClick={() => { setEditing(null); setNoteTitle(""); setNoteText(""); }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Notes for selected date */}
          <div className="notes-list">
            {notesForDate.length === 0 ? (
              <div className="empty-state">
                <p>No notes for {selectedDate}. Write one above!</p>
              </div>
            ) : (
              notesForDate.map((note) => (
                <div key={note.id} className={`note-card ${editing === note.id ? "note-editing" : ""}`}>
                  <div className="note-card-header">
                    <h4>{note.title}</h4>
                    <div className="note-actions">
                      <button className="icon-btn" onClick={() => handleEdit(note)} title="Edit">✏️</button>
                      <button className="icon-btn delete" onClick={() => handleDelete(note.id)} title="Delete">
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <p className="note-text">{note.text}</p>
                  <p className="note-meta">Last updated: {note.updatedAt?.slice(0, 16).replace("T", " ")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
