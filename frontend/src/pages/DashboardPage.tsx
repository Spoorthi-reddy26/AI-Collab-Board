import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface BoardSummary {
  id: number;
  title: string;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const userName = localStorage.getItem("userName") || "there";

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/boards/user/${userId}`);
      if (!response.ok) throw new Error("Failed to fetch boards");
      const data = await response.json();
      setBoards(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openBoard = (boardId: number | null) => {
    if (boardId === null) {
      navigate("/whiteboard/new");
    } else {
      navigate(`/whiteboard/${boardId}`);
    }
  };

  const renameBoard = async (boardId: number, currentTitle: string) => {
    const newTitle = window.prompt("Rename board", currentTitle);
    if (!newTitle || newTitle === currentTitle) return;

    try {
      const response = await fetch(`http://localhost:8080/api/boards/${boardId}/rename`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) throw new Error("Rename failed");
      fetchBoards();
    } catch (err) {
      console.error(err);
      alert("Couldn't rename this board. Try again.");
    }
  };

  const deleteBoard = async (boardId: number) => {
    const confirmed = window.confirm("Delete this board? This can't be undone.");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:8080/api/boards/${boardId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Delete failed");
      fetchBoards();
    } catch (err) {
      console.error(err);
      alert("Couldn't delete this board. Try again.");
    }
  };

  const logout = () => {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("currentBoardId");
    navigate("/login");
  };

  const accentPalette = ["#E0673E", "#3E7C8C", "#9C7A4D", "#5B6FA8", "#7A9C5B"];
  const accentFor = (id: number) => accentPalette[id % accentPalette.length];

  const initials = userName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] text-[#1B1F3B]">
      <aside className="flex w-64 flex-col bg-[#15182E] px-6 py-8 text-[#E9E6DD]">
        <div className="mb-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E0673E] font-bold text-white">
            C
          </div>
          <span className="text-lg font-semibold tracking-tight">CollabBoard</span>
        </div>

        <nav className="flex-1 space-y-1">
          {["Dashboard", "Boards", "Teams", "Settings"].map((item, i) => (
            <div
              key={item}
              className={`cursor-pointer rounded-lg px-3 py-2 text-sm transition ${
                i === 0
                  ? "bg-white/10 font-medium text-white"
                  : "text-[#A9A6A0] hover:bg-white/5 hover:text-white"
              }`}
            >
              {item}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="mb-3 flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E0673E]/20 text-sm font-semibold text-[#E0673E]">
              {initials}
            </div>
            <div className="truncate text-sm">
              <p className="truncate font-medium">{userName}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-[#E9E6DD] transition hover:border-white/20 hover:bg-white/5"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-10 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              Welcome back, {userName.split(" ")[0]}
            </h2>
            <p className="mt-1 text-sm text-[#6B6862]">
              {boards.length === 0
                ? "Start your first board below."
                : `${boards.length} board${boards.length === 1 ? "" : "s"} in your workspace.`}
            </p>
          </div>

          <button
            onClick={() => openBoard(null)}
            className="rounded-lg bg-[#E0673E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#c95a35]"
          >
            + New board
          </button>
        </div>

        {loading && (
          <div className="grid grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-[#EFEAE2]" />
            ))}
          </div>
        )}

        {!loading && boards.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D9D3C7] bg-white/40 py-20 text-center">
            <p className="text-lg font-medium text-[#1B1F3B]">No boards yet</p>
            <p className="mt-1 text-sm text-[#6B6862]">
              Create a board to start sketching, planning, or mapping ideas.
            </p>
            <button
              onClick={() => openBoard(null)}
              className="mt-5 rounded-lg bg-[#1B1F3B] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#262b4d]"
            >
              + Create your first board
            </button>
          </div>
        )}

        {!loading && boards.length > 0 && (
          <div className="grid grid-cols-3 gap-5">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-[#EFEAE2] transition hover:shadow-md"
              >
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: accentFor(board.id) }}
                />

                <div
                  onClick={() => openBoard(board.id)}
                  className="cursor-pointer px-5 py-5"
                >
                  <h3 className="truncate text-base font-semibold text-[#1B1F3B]">
                    {board.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#9C998F]">Open board →</p>
                </div>

                <div className="flex gap-2 border-t border-[#F1EDE5] px-5 py-3 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => renameBoard(board.id, board.title)}
                    className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-[#6B6862] transition hover:bg-[#F4F1EA]"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => deleteBoard(board.id)}
                    className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium text-[#B23A2E] transition hover:bg-[#FBEAE6]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;