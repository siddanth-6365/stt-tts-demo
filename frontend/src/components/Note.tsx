import { useState, FormEvent } from "react";
import { Message } from "../types/speech";

interface NoteProps {
  message: Message;
  onDelete: () => void;
  onEdit: (newText: string) => void;
  onSpeak: () => void;
}

const Note: React.FC<NoteProps> = ({ message, onDelete, onEdit, onSpeak }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedText, setEditedText] = useState<string>(message.text);

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    onEdit(editedText);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "4px",
        backgroundColor: "#fff",
      }}
    >
      {isEditing ? (
        <form onSubmit={handleEditSubmit}>
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            style={{
              width: "100%",
              height: "60px",
              padding: "8px",
              marginBottom: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <div>
            <button
              type="submit"
              style={{
                padding: "4px 8px",
                marginRight: "8px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setEditedText(message.text);
              }}
              style={{
                padding: "4px 8px",
                backgroundColor: "#9e9e9e",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p>{message.text}</p>
          <div>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: "4px 8px",
                marginRight: "8px",
                backgroundColor: "#2196f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              style={{
                padding: "4px 8px",
                marginRight: "8px",
                backgroundColor: "#ff5252",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
            <button
              onClick={onSpeak}
              style={{
                padding: "4px 8px",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              🔊
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Note; 