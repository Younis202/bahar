import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StickyNote, Plus, Trash2, Save, Clock } from 'lucide-react';

interface Note {
  id: string;
  text: string;
  timestamp: string;
  lessonTitle: string;
}

export default function LearningNotes({ lessonId, lessonTitle }: { lessonId: string; lessonTitle: string }) {
  const storageKey = `notes-${lessonId}`;
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch { return []; }
  });
  const [newNote, setNewNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      text: newNote,
      timestamp: new Date().toLocaleString(),
      lessonTitle,
    };
    saveNotes([note, ...notes]);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-primary text-primary-foreground shadow-glow flex items-center justify-center hover:scale-110 transition-transform"
      >
        <StickyNote className="w-5 h-5" />
        {notes.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-xs flex items-center justify-center font-bold">
            {notes.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-card border border-border rounded-xl shadow-card overflow-hidden animate-scale-in">
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-primary" />
          My Notes ({notes.length})
        </h3>
        <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground text-xs">
          Close
        </button>
      </div>

      <div className="p-3 border-b border-border">
        <Textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Write a note for this lesson..."
          className="min-h-[60px] text-sm resize-none"
        />
        <Button size="sm" className="w-full mt-2 bg-gradient-primary text-primary-foreground" onClick={addNote} disabled={!newNote.trim()}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Note
        </Button>
      </div>

      <ScrollArea className="max-h-[300px]">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-xs">
            No notes yet. Start taking notes!
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {notes.map(note => (
              <div key={note.id} className="p-3 hover:bg-secondary/20 group">
                <p className="text-sm mb-1">{note.text}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {note.timestamp}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
